# AI CV chat: API contract (v1)

The contract between the chat widget (`src/data/chat/**`, `src/screens/chat/**`) and the backend
(`api/chat.ts` + `server/chat/**`). It is final for v1: the backend and frontend tickets implement
exactly this. Design context: [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md); decisions:
[`../adr/0001-ai-cv-chat.md`](../adr/0001-ai-cv-chat.md).

## Summary

| | |
|---|---|
| Endpoint | `POST /api/chat` (same origin as the site; no CORS) |
| Request | JSON: `v`, `locale`, the whole conversation in `messages` (the server is stateless) |
| Success | `200`, `text/event-stream`: `delta`\* then exactly one terminal event, `done` or `error` |
| Failure before the stream | non-2xx with a JSON body `{ "error": ChatError }` |
| Version | `v: 1` in the body; response header `X-Chat-Api-Version: 1` |
| Types | `src/data/chat/contract.ts` (shared by `src/` and `server/`; copy the block below verbatim) |

## Request

```http
POST /api/chat HTTP/1.1
Content-Type: application/json
Accept: text/event-stream
Origin: https://cv-web-inky-five.vercel.app
```

| Header | Rule |
|---|---|
| `Content-Type` | Required, must start with `application/json`, else `415 unsupported_media_type`. |
| `Origin` | Required, its host must equal the request host (`X-Forwarded-Host`, else `Host`), else `403 forbidden_origin`. Browsers send it on every `fetch` POST; for `curl`, add it by hand. |
| `Accept` | Optional. The response is always SSE on success. |

Body:

```json
{
  "v": 1,
  "locale": "uk",
  "messages": [
    { "role": "user", "content": "What does Andrew do?" },
    { "role": "assistant", "content": "Andrew is a Senior Android Engineer..." },
    { "role": "user", "content": "Які мобільні застосунки він робив?" }
  ]
}
```

| Field | Type | Rule |
|---|---|---|
| `v` | number | Must be `1`. Missing or not a number: `400 invalid_request`. Another number: `400 unsupported_version`. |
| `locale` | `"en"` \| `"uk"` | The site language at send time. Used for the knowledge locale and as the reply language when the visitor's message language is unclear. Anything else: `400 invalid_request`. |
| `messages` | array | The whole conversation, oldest first. See the rules below. |
| `messages[].role` | `"user"` \| `"assistant"` | Anything else: `400 invalid_request`. |
| `messages[].content` | string | Plain text. Must be non-empty after trimming. |
| other fields | any | Ignored (forward compatibility: a newer client may send additive fields). |

Conversation rules (`400 invalid_request` unless stated otherwise):

1. `messages` has 1 to **20** items (10 visitor turns). More than 20: `422 conversation_limit`.
2. Roles alternate, starting and ending with `user`.
3. The client sends only assistant messages that finished with a `done` event (any `stopReason`),
   with the text exactly as streamed. An answer that ended in `error` is dropped from the history;
   the retry re-sends the same history ending with the same `user` message.

Limits (lengths are JavaScript `String.length`; `413 too_long` when exceeded):

| Limit | Value | Client behaviour |
|---|---:|---|
| One `user` message | **1,000** chars | Composer `maxLength` 1000. |
| One `assistant` message | **4,000** chars | Never reached by real answers (`max_tokens` 800). |
| All `content` together | **24,000** chars | The client starts a new chat past 20 messages first. |
| Request body | **131,072** bytes (128 KiB) | Checked from `Content-Length` and while reading. |

## Success response: SSE stream

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache, no-transform
X-Accel-Buffering: no
X-Chat-Api-Version: 1
X-Request-Id: 3f0c9a4e-6d2b-4a47-9a55-0d8f1c2b7e11
```

Framing is standard [Server-Sent Events](https://html.spec.whatwg.org/multipage/server-sent-events.html):
each event is `event: <name>` + one `data: <json>` line + a blank line. The body is read with
`fetch` + `ReadableStream` (not `EventSource`, which cannot POST). Lines starting with `:` are
comments (the server may send `: ping` keep-alives); clients ignore them and any unknown event
name or unknown JSON field.

| Event | `data` payload | When |
|---|---|---|
| `delta` | `{ "text": string }` | Zero or more times: the next piece of the answer, to append as is. |
| `done` | `{ "stopReason": ChatStopReason, "usage": ChatUsage }` | Terminal. The answer is complete. |
| `error` | `ChatError` | Terminal. The stream failed after it started. |

Stream guarantees:

- Exactly one terminal event (`done` or `error`), then the server closes the stream.
- A stream that ends without a terminal event (network drop, function timeout) is treated by the
  client as `error` with code `upstream_error`, `retryable: true`.
- `stopReason`:
  - `end_turn`: a normal, complete answer.
  - `max_tokens`: the answer hit the 800-token cap. The text so far is kept in the history; the
    UI may show a "shortened" hint.
  - `refusal`: the model's safety system declined. The UI shows a localized polite notice; the
    message is kept in the history as streamed (it may be empty).
- `usage` is informational (the widget does not show it); tests and dev tools may.

## Error response (before the stream)

Any non-2xx response. The body is JSON unless it came from the platform (see the last rows).

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json; charset=utf-8
Cache-Control: no-store
Retry-After: 42
X-Chat-Api-Version: 1
X-Request-Id: 9b1d...

{ "error": { "code": "rate_limited", "message": "Too many messages. Try again in a minute.", "retryable": true, "retryAfterSeconds": 42, "requestId": "9b1d..." } }
```

`message` is English, for logs and developers only. The widget shows its own localized text per
`code` (strings in `src/screens/chat/strings.ts`).

| Status | `code` | `retryable` | Cause |
|---:|---|---|---|
| 400 | `invalid_request` | false | Malformed JSON, schema or conversation-rule violation. |
| 400 | `unsupported_version` | false | `v` is a number other than `1` (an outdated tab after a breaking release). The widget asks to reload the page. |
| 403 | `forbidden_origin` | false | `Origin` missing or not the site's host. |
| 405 | `method_not_allowed` | false | Not `POST` (header `Allow: POST`). |
| 413 | `too_long` | false | A length or body limit above. |
| 415 | `unsupported_media_type` | false | `Content-Type` is not JSON. |
| 422 | `conversation_limit` | false | More than 20 messages. The widget offers "Start a new chat". |
| 429 | `rate_limited` | true | Per-IP limit (see below). `Retry-After` header (seconds) and `retryAfterSeconds`. |
| 500 | `internal_error` | true | Unexpected server bug. |
| 502 | `upstream_error` | per cause | Claude failed before the first byte: `true` for Anthropic 429/5xx/529, network, timeout; `false` for 4xx (bad key, bad model, spend limit reached). |
| 503 | `unavailable` | true | Chat switched off (`CHAT_ENABLED=false`), `ANTHROPIC_API_KEY` missing, or the per-instance hourly cap is hit. `Retry-After` when known. |
| 429 (platform) | none (non-JSON) | true | The Vercel Firewall rate-limit rule. The client maps any `429` without a parsable body to `rate_limited` and reads `Retry-After` if present (default 60 s). |
| 5xx (platform) | none (non-JSON) | true | E.g. `504 FUNCTION_INVOCATION_TIMEOUT`. The client maps any unparsable non-2xx to `upstream_error` (`retryable: true` for 5xx, `false` otherwise). |

Mid-stream `error` events use only `upstream_error` and `internal_error`.

Rate limits behind `rate_limited` (all per client IP, best effort; details in `SYSTEM_DESIGN.md`):
Vercel Firewall rule 30 requests / 10 min; in-function 8 requests / 60 s and 100 requests / 24 h.
All `POST`s count, valid or not.

## Versioning

- The version lives in the body (`v`) and the `X-Chat-Api-Version` response header; the path
  stays `/api/chat`. The site and the function deploy together, so skew only comes from tabs
  opened before a deploy (Vercel Skew Protection is not on Hobby).
- **Additive, non-breaking** changes keep `v: 1`: new optional request fields (the server ignores
  unknown ones), new response fields, new SSE event names, new error codes (clients map unknown
  codes to a generic "Something went wrong" and treat them as `retryable: false`).
- **Breaking** changes bump `v`. The server then accepts the new and the previous version for at
  least one release and answers others with `400 unsupported_version`.

## TypeScript types

File: `src/data/chat/contract.ts`. Framework-free (no React, DOM, Vite or Node imports), because
`server/chat/**` imports it too. Copy verbatim.

```ts
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
```

## Example exchange

Request (second turn, Ukrainian site, visitor switches to Ukrainian):

```json
{
  "v": 1,
  "locale": "uk",
  "messages": [
    { "role": "user", "content": "Hi! What is Andrew's current role?" },
    { "role": "assistant", "content": "Andrew is a Senior Android Engineer with iOS experience. His latest role was Senior Android Developer at Transcenda (Feb 2021 - Feb 2026)." },
    { "role": "user", "content": "Над якими застосунками він працював?" }
  ]
}
```

Response:

```text
HTTP/1.1 200 OK
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache, no-transform
X-Chat-Api-Version: 1
X-Request-Id: 3f0c9a4e-6d2b-4a47-9a55-0d8f1c2b7e11

event: delta
data: {"text":"Андрій відповідав за ключові функції "}

event: delta
data: {"text":"застосунків для розумного дому Cync і August Home, "}

event: delta
data: {"text":"кожен з яких має понад 1 млн користувачів."}

event: done
data: {"stopReason":"end_turn","usage":{"inputTokens":2014,"outputTokens":61,"cacheReadInputTokens":0,"cacheCreationInputTokens":0}}

```

The same request with an 1,001-character last message:

```text
HTTP/1.1 413 Payload Too Large
Content-Type: application/json; charset=utf-8
X-Chat-Api-Version: 1

{"error":{"code":"too_long","message":"messages[2].content exceeds 1000 characters","retryable":false,"requestId":"..."}}
```

A stream that fails midway ends with:

```text
event: error
data: {"code":"upstream_error","message":"Upstream stream failed: overloaded","retryable":true,"requestId":"3f0c9a4e-..."}

```
