/**
 * `/api/chat` `v: 3`, the live-fix show dialect (docs/chat/API.md → v3). Shared by the browser
 * (`src/data/retro/**`) and the backend (`server/chat/show/**`). Framework-free; `.js` specifiers
 * because `server/**` runs this file on Node. Errors, stop reasons and usage are the chat's shared
 * ones (`src/data/chat/contract.ts`), without tool calls.
 */
import type { ChatError, ChatMessage, ChatStopReason, ChatUsage } from '../chat/contract.js';
import type { RetroNarrationKey, RetroStepId } from './scenario.js';
import type { ShowScenarioId } from './scenarios.js';

export const CHAT_API_VERSION_V3 = 3;

/** Lengths are `String.length`. Exceeding one is `too_long` (or `conversation_limit`). */
export const RETRO_LIMITS = {
  /** 10 visitor messages. */
  maxMessages: 20,
  maxVisitorMessageChars: 1_000,
  maxAssistantMessageChars: 1_000,
  /** The server trims longer narration lines to this. */
  maxNarrationLineChars: 200,
} as const;

/** `narrate`: commentary for every step of the scenario, streamed as `line` events. */
export interface ShowNarrateRequest {
  v: typeof CHAT_API_VERSION_V3;
  locale: 'en';
  kind: 'narrate';
  scenario: ShowScenarioId;
}

/** `reply`: answer the visitor; plain `messages` alternate, start and end with `user`. */
export interface ShowReplyRequest {
  v: typeof CHAT_API_VERSION_V3;
  locale: 'en';
  kind: 'reply';
  scenario: ShowScenarioId;
  /** The step on screen when the message was sent; `null` before the first step. */
  step: RetroStepId | null;
  stepsDone: number;
  messages: ChatMessage[];
}

export type ShowRequest = ShowNarrateRequest | ShowReplyRequest;
export type ShowKind = ShowRequest['kind'];

/** SSE event names and the JSON in their `data:` line. */
export interface ShowSsePayloads {
  /** `narrate` only: one complete line per known key, first occurrence wins. */
  line: { key: RetroNarrationKey; text: string };
  /** `reply` only. */
  delta: { text: string };
  done: { stopReason: ChatStopReason; usage: ChatUsage };
  error: ChatError;
}
export type ShowSseEventName = keyof ShowSsePayloads;

/** What `ShowRepository.narrate` yields: `line`s, then one terminal `done` or `error`. */
export type ShowNarrateStreamEvent =
  | { type: 'line'; key: RetroNarrationKey; text: string }
  | { type: 'done'; stopReason: ChatStopReason; usage: ChatUsage }
  | { type: 'error'; error: ChatError };

/** What `ShowRepository.reply` yields: `delta`s, then one terminal `done` or `error`. */
export type ShowReplyStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; stopReason: ChatStopReason; usage: ChatUsage }
  | { type: 'error'; error: ChatError };
