import type { ChatErrorCode, ChatPage, ChatStopReasonV2 } from '../../src/data/chat/contract.js';
import type { ShowKind } from '../../src/data/retro/contract.js';
import type { RetroStepId } from '../../src/data/retro/scenario.js';
import type { ShowScenarioId } from '../../src/data/retro/scenarios.js';

/**
 * One structured line per request (docs/chat/SYSTEM_DESIGN.md §10). Never holds message text,
 * the IP address, the user agent or cookies.
 */
export interface ChatLogEntry {
  evt: 'chat';
  requestId: string;
  v: number | null;
  status: number;
  /** `done`, `error` (pre-stream or mid-stream), `aborted` (the visitor went away). */
  outcome: 'done' | 'error' | 'aborted';
  stopReason: ChatStopReasonV2 | null;
  errorCode: ChatErrorCode | null;
  locale: string | null;
  /** v1/v2: the page the chat answered for (`cv` when the client sent none). */
  page: ChatPage | null;
  model: string;
  promptVersion: string;
  messages: number | null;
  inputChars: number | null;
  ttftMs: number | null;
  durationMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  cacheReadTokens: number | null;
  cacheWriteTokens: number | null;
  costUsd: number | null;
  anthropicRequestId: string | null;
  /** Upstream error type / status, when the model call failed. */
  upstreamError: string | null;
  country: string | null;
  limiter: 'ok' | 'ip' | 'instance' | null;
  /** v2: `tool_call` events streamed in this response (at most 3) and their tool names. */
  toolCalls: number | null;
  toolNames: string[] | null;
  /** v2: tool rounds already in this visitor turn (0 = answering a question). */
  toolRound: number | null;
  toolChoice: 'auto' | 'none' | null;
  /** v2: length of the `providerState` sent with `done`. */
  providerStateBytes: number | null;
  /** v3: the show request's kind. */
  showKind: ShowKind | null;
  /** v3: the scenario the show runs (its page's), an id. */
  showScenario: ShowScenarioId | null;
  /** v3 `reply`: the step on screen when the visitor wrote (`null` also before the first step). */
  stepId: RetroStepId | null;
  /** v3 `narrate`: `line` events streamed. */
  narrationLines: number | null;
  /** This instance's estimated spend for the current UTC day, this request included. */
  dayCostUsd: number | null;
}

export type ChatLogger = (entry: ChatLogEntry) => void;

export const consoleLogger: ChatLogger = (entry) => {
  console.log(JSON.stringify(entry));
};
