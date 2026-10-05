import type {
  AgentToolCall,
  ChatRole,
  ChatStopReasonV2,
  ChatUsage,
} from '../../../src/data/chat/contract.js';

/**
 * The model request, shaped like the Anthropic Messages API body so `AnthropicLlmClient` passes it
 * through as is. Declared here (not imported from the SDK) so the SDK stays in one file; the
 * compiler checks the two stay compatible where the client passes it on.
 */
export interface LlmSystemBlock {
  type: 'text';
  text: string;
  cache_control?: { type: 'ephemeral' };
}

export interface LlmRequestKnobs {
  thinking?: { type: 'between_tools' };
  output_config?: { effort: 'low' | 'medium' | 'high' };
  fallbacks?: 'default';
  betas?: string[];
}

/** Assistant content the model produced; echoed back unchanged on the next request. */
export type LlmAssistantBlock =
  | { type: 'text'; text: string }
  | { type: 'thinking'; thinking: string; signature: string }
  | { type: 'redacted_thinking'; data: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> };

export interface LlmToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  /** The `AgentToolResult` as JSON. */
  content: string;
  is_error?: boolean;
}

export type LlmContentBlock = LlmAssistantBlock | LlmToolResultBlock;

export interface LlmMessage {
  role: ChatRole;
  content: string | LlmContentBlock[];
}

/** A client-executed tool (`AgentToolSpec` without `confirm`). */
export interface LlmTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
    additionalProperties: false;
  };
  strict: true;
}

export interface LlmRequest extends LlmRequestKnobs {
  model: string;
  max_tokens: number;
  /** The chat (v4) only; rendered before `system`, so it heads the cached prefix. */
  tools?: LlmTool[];
  tool_choice?: { type: 'auto' | 'none' };
  system: LlmSystemBlock[];
  messages: LlmMessage[];
  /** Top-level automatic caching: the growing conversation is read from cache next turn. */
  cache_control?: { type: 'ephemeral' };
}

export type LlmEvent =
  | { type: 'text'; text: string }
  /** A complete `tool_use` block, emitted when the block stops. */
  | { type: 'tool_call'; call: AgentToolCall }
  | {
      type: 'done';
      stopReason: ChatStopReasonV2;
      usage: ChatUsage;
      /** The whole assistant turn, in order; present when `stopReason` is `tool_use`. */
      blocks?: LlmAssistantBlock[];
    };

/** A started model stream: the upstream accepted the request. */
export interface LlmStream {
  events: AsyncIterable<LlmEvent>;
  /** The provider's request id, for logs. */
  providerRequestId?: string;
}

export interface LlmClient {
  /**
   * Starts a stream. Rejects with `LlmError` when the upstream fails before the stream starts;
   * iterating `events` throws `LlmError` when it fails midway. Aborting `signal` stops both.
   * `events` ends with exactly one `done`.
   */
  start(request: LlmRequest, signal: AbortSignal): Promise<LlmStream>;
}

/** An upstream failure, already classified. */
export class LlmError extends Error {
  readonly retryable: boolean;
  readonly status?: number;
  readonly errorType?: string;
  readonly providerRequestId?: string;

  constructor(
    message: string,
    details: {
      retryable: boolean;
      status?: number;
      errorType?: string;
      providerRequestId?: string;
    },
  ) {
    super(message);
    this.name = 'LlmError';
    this.retryable = details.retryable;
    this.status = details.status;
    this.errorType = details.errorType;
    this.providerRequestId = details.providerRequestId;
  }
}
