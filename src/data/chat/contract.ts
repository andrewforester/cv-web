/**
 * AI CV chat API contract, v1 (docs/chat/API.md). Shared by the widget (`src/data/chat/**`) and the
 * backend (`server/chat/**`). Keep it framework-free: no React, DOM, Vite or Node imports.
 */

export const CHAT_API_PATH = '/api/chat';
export const CHAT_API_VERSION = 1;
export const CHAT_API_VERSION_HEADER = 'X-Chat-Api-Version';
export const CHAT_REQUEST_ID_HEADER = 'X-Request-Id';

export const CHAT_LOCALES = ['en', 'uk'] as const;
export type ChatLocale = (typeof CHAT_LOCALES)[number];

/** Request limits; lengths are `String.length`. Exceeding one is `too_long` (or `conversation_limit`). */
export const CHAT_LIMITS = {
  maxMessages: 20,
  maxUserMessageChars: 1_000,
  maxAssistantMessageChars: 4_000,
  maxTotalChars: 24_000,
  maxBodyBytes: 131_072,
} as const;

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  /** Plain text, non-empty after trimming. */
  content: string;
}

/** `POST /api/chat` body. Roles alternate, starting and ending with `user`. */
export interface ChatRequest {
  v: typeof CHAT_API_VERSION;
  locale: ChatLocale;
  messages: ChatMessage[];
}

export type ChatStopReason = 'end_turn' | 'max_tokens' | 'refusal';

export interface ChatUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
}

export type ChatErrorCode =
  | 'invalid_request'
  | 'unsupported_version'
  | 'forbidden_origin'
  | 'method_not_allowed'
  | 'too_long'
  | 'unsupported_media_type'
  | 'conversation_limit'
  | 'rate_limited'
  | 'internal_error'
  | 'upstream_error'
  | 'unavailable';

export interface ChatError {
  code: ChatErrorCode;
  /** English, for logs and developers; the UI shows its own localized text per `code`. */
  message: string;
  retryable: boolean;
  /** Present on `rate_limited` and, when known, `unavailable`. */
  retryAfterSeconds?: number;
  requestId?: string;
}

/** JSON body of every non-2xx response the function itself returns. */
export interface ChatErrorBody {
  error: ChatError;
}

/** SSE event names and the JSON in their `data:` line. */
export interface ChatSsePayloads {
  delta: { text: string };
  done: { stopReason: ChatStopReason; usage: ChatUsage };
  error: ChatError;
}
export type ChatSseEventName = keyof ChatSsePayloads;

/** What `ChatRepository` yields to the app: one SSE event, or a pre-stream/transport error. */
export type ChatStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; stopReason: ChatStopReason; usage: ChatUsage }
  | { type: 'error'; error: ChatError };
