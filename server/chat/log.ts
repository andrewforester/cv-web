import type { ChatErrorCode, ChatStopReason } from '../../src/data/chat/contract.js';

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
  stopReason: ChatStopReason | null;
  errorCode: ChatErrorCode | null;
  locale: string | null;
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
}

export type ChatLogger = (entry: ChatLogEntry) => void;

export const consoleLogger: ChatLogger = (entry) => {
  console.log(JSON.stringify(entry));
};
