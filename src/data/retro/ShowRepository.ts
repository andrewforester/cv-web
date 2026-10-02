import type { ShowNarrateStreamEvent, ShowReplyRequest, ShowReplyStreamEvent } from './contract';
import type { ShowScenarioId } from './scenarios';

/** What the show knows when the visitor sends a message. */
export type ShowReplyState = Pick<ShowReplyRequest, 'step' | 'stepsDone' | 'messages'>;

/** A reply request without its wire fields: the running scenario and the show state. */
export type ShowReplyInput = Pick<ShowReplyRequest, 'scenario'> & ShowReplyState;

/**
 * The show's LLM seam (docs/chat/API.md → v3): narration for the whole scenario and replies to the
 * visitor. One bound repository serves every page, so the scenario comes with each call. Each
 * stream yields its events, then exactly one terminal `done` or `error`. Never throws for
 * protocol, HTTP or network failures: they arrive as an `error` event, and the show goes scripted.
 * When `signal` aborts, the stream just ends (no terminal event).
 */
export interface ShowRepository {
  narrate(scenario: ShowScenarioId, signal?: AbortSignal): AsyncIterable<ShowNarrateStreamEvent>;
  reply(input: ShowReplyInput, signal?: AbortSignal): AsyncIterable<ShowReplyStreamEvent>;
}
