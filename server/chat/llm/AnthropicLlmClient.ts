import Anthropic, { type ClientOptions } from '@anthropic-ai/sdk';
import type { ChatStopReason, ChatUsage } from '../../../src/data/chat/contract.js';
import {
  LlmError,
  type LlmClient,
  type LlmEvent,
  type LlmRequest,
  type LlmStream,
} from './LlmClient.js';

/** Maps the API stop reason; anything outside the contract is a normal end. */
export function mapStopReason(reason: string | null | undefined): ChatStopReason {
  return reason === 'max_tokens' || reason === 'refusal' ? reason : 'end_turn';
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
    try {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield { type: 'text', text: event.delta.text };
        }
      }
      const message = await stream.finalMessage();
      completed = true;
      yield {
        type: 'done',
        stopReason: mapStopReason(message.stop_reason),
        usage: mapUsage(message.usage),
      };
    } catch (error) {
      throw toLlmError(error);
    } finally {
      // The consumer stopped early (visitor abort, deadline): stop generation and billing.
      if (!completed) stream.abort();
    }
  }
}
