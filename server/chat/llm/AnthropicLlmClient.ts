import Anthropic, { type ClientOptions } from '@anthropic-ai/sdk';
import {
  AGENT_TOOL_NAMES,
  type AgentToolCall,
  type ChatStopReasonV2,
  type ChatUsage,
} from '../../../src/data/chat/contract.js';
import {
  LlmError,
  type LlmAssistantBlock,
  type LlmClient,
  type LlmEvent,
  type LlmRequest,
  type LlmStream,
} from './LlmClient.js';

/** Maps the API stop reason; anything outside the contract is a normal end. */
export function mapStopReason(reason: string | null | undefined): ChatStopReasonV2 {
  return reason === 'max_tokens' || reason === 'refusal' || reason === 'tool_use'
    ? reason
    : 'end_turn';
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** A completed `tool_use` as a call, or undefined for an unknown tool or unparsable input. */
export function toToolCall(id: string, name: string, json: string): AgentToolCall | undefined {
  if (!(AGENT_TOOL_NAMES as readonly string[]).includes(name)) return undefined;
  let input: unknown;
  try {
    input = json.trim() === '' ? {} : JSON.parse(json);
  } catch {
    return undefined;
  }
  return isRecord(input) ? { id, name: name as AgentToolCall['name'], input } : undefined;
}

/** The final message's content blocks the next request must echo (known types only). */
export function assistantBlocks(content: readonly { type: string }[]): LlmAssistantBlock[] {
  return content.flatMap((block): LlmAssistantBlock[] => {
    const b = block as Record<string, unknown>;
    switch (block.type) {
      case 'text':
        return [{ type: 'text', text: String(b.text) }];
      case 'thinking':
        return [{ type: 'thinking', thinking: String(b.thinking), signature: String(b.signature) }];
      case 'redacted_thinking':
        return [{ type: 'redacted_thinking', data: String(b.data) }];
      case 'tool_use':
        return isRecord(b.input)
          ? [{ type: 'tool_use', id: String(b.id), name: String(b.name), input: b.input }]
          : [];
      default:
        return [];
    }
  });
}

interface UsageLike {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

export function mapUsage(usage: UsageLike): ChatUsage {
  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheReadInputTokens: usage.cache_read_input_tokens ?? 0,
    cacheCreationInputTokens: usage.cache_creation_input_tokens ?? 0,
  };
}

/**
 * Classifies an SDK error: retryable for 429/5xx/529, network and timeouts, and for errors that
 * arrive inside the stream (e.g. `overloaded_error`, no HTTP status); not retryable for other 4xx
 * (bad key, bad model, spend limit reached). Aborts are rethrown as is.
 */
export function toLlmError(error: unknown): unknown {
  if (error instanceof Anthropic.APIUserAbortError || !(error instanceof Anthropic.APIError)) {
    return error;
  }
  const status = error.status;
  const retryable = status === undefined || status === 429 || status >= 500;
  const errorType =
    error.type ?? (error instanceof Anthropic.APIConnectionError ? 'connection' : undefined);
  return new LlmError(`Upstream ${errorType ?? 'error'}${status ? ` (${status})` : ''}`, {
    retryable,
    status,
    errorType: errorType ?? undefined,
    providerRequestId: error.requestID ?? undefined,
  });
}

/** The only importer of `@anthropic-ai/sdk`: streams a Claude answer as `LlmEvent`s. */
export class AnthropicLlmClient implements LlmClient {
  private readonly client: Anthropic;

  constructor(options: ClientOptions) {
    this.client = new Anthropic({ maxRetries: 2, timeout: 55_000, ...options });
  }

  async start(request: LlmRequest, signal: AbortSignal): Promise<LlmStream> {
    const { betas, ...params } = request;
    const stream = this.client.beta.messages.stream(
      { ...params, ...(betas ? { betas } : {}) },
      { signal },
    );
    let requestId: string | undefined;
    try {
      requestId = (await stream.withResponse()).request_id ?? undefined;
    } catch (error) {
      throw toLlmError(error);
    }
    return { events: this.events(stream), providerRequestId: requestId };
  }

  private async *events(
    stream: ReturnType<Anthropic['beta']['messages']['stream']>,
  ): AsyncGenerator<LlmEvent> {
    let completed = false;
    // Open tool_use blocks by index: their input JSON arrives in pieces.
    const tools = new Map<number, { id: string; name: string; json: string }>();
    try {
      for await (const event of stream) {
        if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
          const { id, name } = event.content_block;
          tools.set(event.index, { id, name, json: '' });
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') yield { type: 'text', text: event.delta.text };
          const tool = tools.get(event.index);
          if (tool && event.delta.type === 'input_json_delta')
            tool.json += event.delta.partial_json;
        } else if (event.type === 'content_block_stop') {
          const tool = tools.get(event.index);
          const call = tool && toToolCall(tool.id, tool.name, tool.json);
          if (call) yield { type: 'tool_call', call };
        }
      }
      const message = await stream.finalMessage();
      completed = true;
      const stopReason = mapStopReason(message.stop_reason);
      yield {
        type: 'done',
        stopReason,
        usage: mapUsage(message.usage),
        ...(stopReason === 'tool_use' ? { blocks: assistantBlocks(message.content) } : {}),
      };
    } catch (error) {
      throw toLlmError(error);
    } finally {
      // The consumer stopped early (visitor abort, deadline): stop generation and billing.
      if (!completed) stream.abort();
    }
  }
}
