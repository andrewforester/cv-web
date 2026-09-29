import type { ChatRole, ChatStopReason, ChatUsage } from '../../../src/data/chat/contract.js';

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

export interface LlmRequest extends LlmRequestKnobs {
  model: string;
  max_tokens: number;
  system: LlmSystemBlock[];
  messages: { role: ChatRole; content: string }[];
  /** Top-level automatic caching: the growing conversation is read from cache next turn. */
  cache_control?: { type: 'ephemeral' };
}

export type LlmEvent =
  { type: 'text'; text: string } | { type: 'done'; stopReason: ChatStopReason; usage: ChatUsage };

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
