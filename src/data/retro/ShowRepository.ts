import type { ShowNarrateStreamEvent, ShowReplyRequest, ShowReplyStreamEvent } from './contract';

/** What the show knows when the visitor sends a message; the repository adds the wire fields. */
export type ShowReplyInput = Pick<ShowReplyRequest, 'step' | 'stepsDone' | 'messages'>;

/**
 * The show's LLM seam (docs/chat/API.md → v3): narration for the whole scenario and replies to the
 * visitor. Each stream yields its events, then exactly one terminal `done` or `error`. Never throws
 * for protocol, HTTP or network failures: they arrive as an `error` event, and the show goes
 * scripted. When `signal` aborts, the stream just ends (no terminal event).
 */
export interface ShowRepository {
  narrate(signal?: AbortSignal): AsyncIterable<ShowNarrateStreamEvent>;
  reply(input: ShowReplyInput, signal?: AbortSignal): AsyncIterable<ShowReplyStreamEvent>;
}
