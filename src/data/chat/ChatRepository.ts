import type { ChatRequest, ChatStreamEvent } from './contract';

/**
 * The chat seam: streams one answer for a conversation (docs/chat/API.md).
 *
 * Yields `delta`* then exactly one terminal `done` or `error`. Never throws for protocol, HTTP or
 * network failures: they arrive as an `error` event. When `signal` aborts, the stream just ends
 * (no terminal event): the caller already knows it stopped.
 */
export interface ChatRepository {
  send(request: ChatRequest, signal?: AbortSignal): AsyncIterable<ChatStreamEvent>;
}
