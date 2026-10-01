# AI CV chat: API contract (v1, v2, v3)

The contract between the chat widget (`src/data/chat/**`, `src/screens/chat/**`) and the backend
(`api/chat.ts` + `server/chat/**`). It is final for v1 and for v2 (page-agent tools,
[below](#v2-page-agent-tools)): the backend and frontend tickets implement exactly this. Design
context: [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md); decisions:
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
 * AI CV chat API contract, v1 and v2 (docs/chat/API.md). Shared by the widget (`src/data/chat/**`) and the
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

---

## v2: page-agent tools

> Final (GRA-32). Design: [`AGENT.md`](AGENT.md), decision:
> [`../adr/0002-page-agent-tools.md`](../adr/0002-page-agent-tools.md). Everything above stays the
> v1 contract. Types live in `src/data/chat/contract.ts` (wire) and `src/data/chat/agentTools.ts`
> (tool catalogue); the blocks below are copies, the files win if they ever differ.

**Why a new version:** messages gain new shapes and a stream can now end with
`stopReason: 'tool_use'`, which a v1 widget can't handle. Per Versioning, the server serves
`v: 1` exactly as above (no tools) and `v: 2` as below, both for at least one release.

### What changes from v1

| Area | v2 |
|---|---|
| `v` | `2` |
| Tools | The server always sends the full tool catalogue (`buildAgentToolSpecs`) to the model. The client never sends tool definitions. |
| User message | `{ role: 'user', content, page }`: text + the page snapshot at send time (kept in the history and echoed verbatim). |
| Tool-call turn | `{ role: 'assistant', content, toolCalls, providerState? }`: `content` may be empty when `toolCalls` is present. |
| Tool results | `{ role: 'user', toolResults }`, right after the assistant message with `toolCalls`, one result per call id, same order. |
| Roles | Still alternate, start with a text `user` message, end with a `user` message (text or results). |
| Limits | `maxMessages` **40** (`422 conversation_limit` above); at most **10** text `user` messages; per-question and total char limits as v1; `page` at most 1,000 chars as JSON; `providerState` at most 16,384 chars; at most 3 `toolCalls` per assistant message; at most 2 consecutive tool rounds after the last text `user` message (the server then answers with tools disabled). |
| SSE | New event `tool_call`; `done.stopReason` adds `'tool_use'`; `done` may carry `providerState`. |
| Errors | No new codes: v2 shape violations are `400 invalid_request`; budget stop is `503 unavailable` with `retryAfterSeconds`. |

### Stream

| Event | `data` | When |
|---|---|---|
| `delta` | `{ "text": string }` | As v1 (usually one short sentence before a tool call). |
| `tool_call` | `AgentToolCall` | Once per completed `tool_use` block, in order. |
| `done` | `{ stopReason, usage, providerState? }` | Terminal. With `stopReason: 'tool_use'` the client executes the calls **after** `done`, then posts a follow-up. |
| `error` | `ChatError` | Terminal, as v1. The client runs no tool from a stream that ended in `error`. |

### Types

`src/data/chat/contract.ts`, after the v1 block:

```ts
export const CHAT_API_VERSION_V2 = 2;

/** v2 limits: v1's char limits plus the tool-loop caps. */
export const CHAT_LIMITS_V2 = {
  ...CHAT_LIMITS,
  maxMessages: 40,
  /** Text `user` messages (questions) per conversation. */
  maxUserQuestions: 10,
  /** `JSON.stringify(page).length`. */
  maxPageStateChars: 1_000,
  maxProviderStateChars: 16_384,
  maxToolCallsPerMessage: 3,
  /** Assistant `toolCalls` messages after the last text `user` message; then tools are off. */
  maxToolRoundsPerTurn: 2,
} as const;

/** Sorted, like the tool list the model gets. */
export const AGENT_TOOL_NAMES = [
  'highlightElement',
  'openContact',
  'scrollToSection',
  'switchLanguage',
] as const;
export type AgentToolName = (typeof AGENT_TOOL_NAMES)[number];

/** CV page sections in page order; `data-agent-id="section:<id>"`. */
export const AGENT_SECTION_IDS = [
  'header',
  'summary',
  'technologies',
  'latest-experience',
  'apps',
  'education',
  'about',
  'previous-experience',
] as const;
export type AgentSectionId = (typeof AGENT_SECTION_IDS)[number];

/** Contact channels of the CV header (`Contacts`); `data-agent-id="contact:<channel>"`. */
export const AGENT_CONTACT_CHANNELS = ['email', 'phone', 'whatsapp', 'telegram'] as const;
export type AgentContactChannel = (typeof AGENT_CONTACT_CHANNELS)[number];

/** Target kinds; item ids (`technology`, `experience`, `app`, `book`) come from the CV JSON. */
export const AGENT_TARGET_KINDS = [
  'section',
  'technology',
  'experience',
  'app',
  'book',
  'contact',
] as const;
export type AgentTargetKind = (typeof AGENT_TARGET_KINDS)[number];

/** `<kind>:<id>`, the value of the target element's `data-agent-id`. */
export type AgentTargetId = `${AgentTargetKind}:${string}`;

export const AGENT_VIEWPORTS = ['desktop', 'mobile'] as const;
/** The chat widget's layout: floating card (desktop) or full-screen sheet (under 600 px). */
export const AGENT_CHAT_LAYOUTS = ['card', 'sheet'] as const;

/** Page snapshot sent with each question: enums and booleans only, never text or values. */
export interface AgentPageState {
  route: '/';
  locale: ChatLocale;
  viewport: (typeof AGENT_VIEWPORTS)[number];
  chat: (typeof AGENT_CHAT_LAYOUTS)[number];
  activeSection: AgentSectionId | null;
  highlighted: AgentTargetId | null;
  /** Tools registered (mounted) right now, sorted. */
  tools: AgentToolName[];
}

/** One `tool_use` of the model, streamed as a `tool_call` event and echoed in `toolCalls`. */
export interface AgentToolCall {
  /** The model's `tool_use` id. */
  id: string;
  name: AgentToolName;
  /** Validated by the client against the tool's JSON Schema before anything runs. */
  input: Record<string, unknown>;
}

export const AGENT_TOOL_ERRORS = [
  'not_available',
  'unknown_target',
  'invalid_params',
  'declined',
  'failed',
] as const;
export type AgentToolError = (typeof AGENT_TOOL_ERRORS)[number];

/** Fixed enums only: no page text ever goes back to the model. */
export type AgentToolResult = { ok: true } | { ok: false; error: AgentToolError };

export interface AgentToolResultItem {
  /** The `AgentToolCall.id` it answers. */
  callId: string;
  result: AgentToolResult;
}

/** A visitor question with the page snapshot taken when it was sent. */
export interface ChatUserMessageV2 {
  role: 'user';
  /** Plain text, non-empty after trimming. */
  content: string;
  page: AgentPageState;
}

/** Results of the preceding assistant message's `toolCalls`: one per call, same order. */
export interface ChatToolResultsMessageV2 {
  role: 'user';
  toolResults: AgentToolResultItem[];
}

export interface ChatAssistantMessageV2 {
  role: 'assistant';
  /** May be empty when `toolCalls` is present. */
  content: string;
  toolCalls?: AgentToolCall[];
  /** Opaque, from `done.providerState`; echoed verbatim, never parsed by the client. */
  providerState?: string;
}

export type ChatMessageV2 = ChatUserMessageV2 | ChatToolResultsMessageV2 | ChatAssistantMessageV2;

/** Roles alternate, start with a text `user` message and end with a `user` message. */
export interface ChatRequestV2 {
  v: typeof CHAT_API_VERSION_V2;
  locale: ChatLocale;
  messages: ChatMessageV2[];
}

/** `tool_use`: the client runs the streamed calls, then posts the results in a follow-up. */
export type ChatStopReasonV2 = ChatStopReason | 'tool_use';

export interface ChatSsePayloadsV2 {
  delta: { text: string };
  tool_call: AgentToolCall;
  done: { stopReason: ChatStopReasonV2; usage: ChatUsage; providerState?: string };
  error: ChatError;
}
export type ChatSseEventNameV2 = keyof ChatSsePayloadsV2;

/** v2 stream events for the app; tool calls run only after `done` with `stopReason: 'tool_use'`. */
export type ChatStreamEventV2 =
  | { type: 'delta'; text: string }
  | ({ type: 'tool_call' } & AgentToolCall)
  | { type: 'done'; stopReason: ChatStopReasonV2; usage: ChatUsage; providerState?: string }
  | { type: 'error'; error: ChatError };
```

`src/data/chat/agentTools.ts` holds the catalogue both sides use (framework-free; it imports with
`.js` specifiers because `server/**` runs it on Node):

```ts
/** One string parameter restricted to an enum of real ids. */
export interface AgentToolEnumParam {
  type: 'string';
  description: string;
  enum: string[];
}

/** Strict-compatible JSON Schema: an object, every property required, nothing extra. */
export type AgentToolInputSchema = {
  type: 'object';
  properties: Record<string, AgentToolEnumParam>;
  required: string[];
  additionalProperties: false;
};

/** A tool as the model sees it; WebMCP's shape minus `execute`. */
export interface AgentToolSpec {
  name: AgentToolName;
  /** For the model; English, one or two sentences. */
  description: string;
  inputSchema: AgentToolInputSchema;
  /** Outward or irreversible: the chat asks the visitor before running it. */
  confirm: boolean;
}

/** What the chat needs from the page: implemented by the browser registry, faked in tests. */
export interface AgentToolExecutor {
  /** The full catalogue, mounted or not. */
  specs(): AgentToolSpec[];
  /** Tools registered right now, sorted (`AgentPageState.tools`). */
  available(): AgentToolName[];
  /** Never throws: invalid input → `invalid_params`, unmounted tool → `not_available`. */
  execute(call: AgentToolCall): Promise<AgentToolResult>;
}

/** Every highlightable target, `<kind>:<id>`: sections, CV items in data order, contacts. */
export declare function agentTargetIds(cv: Cv): AgentTargetId[];

/** Deterministic: sorted by name, ids in CV data order, the same in every locale. */
export declare function buildAgentToolSpecs(cv: Cv): AgentToolSpec[];
```

### Tool catalogue

`buildAgentToolSpecs(cv)` returns these four specs, each with one required string parameter
restricted to an enum:

| Tool | Parameter | Enum | `confirm` |
|---|---|---|---|
| `highlightElement` | `target` | `section:<AgentSectionId>` (8), then `technology:`, `experience:` (latest, then previous), `app:`, `book:` with the CV ids in data order, then `contact:<channel>` (4) | `false` |
| `openContact` | `channel` | `email`, `phone`, `whatsapp`, `telegram` | `true` |
| `scrollToSection` | `section` | `AGENT_SECTION_IDS` in page order | `false` |
| `switchLanguage` | `locale` | `en`, `uk` | `false` |

Item ids are the `id` fields of `TechnologyCard`, `ExperienceEntry`, `AppCard` and `Book`
(`src/data/models.ts`): lowercase slugs (`kotlin`, `august-home`), equal in every locale's JSON,
so the catalogue is byte-identical across locales. The server maps a spec to an Anthropic tool as
`{ name, description, input_schema: inputSchema, strict: true }`; `confirm` stays client-side.

### Example: one tool round

Request 1 (the visitor asks):

```json
{ "v": 2, "locale": "en", "messages": [
  { "role": "user", "content": "Show me his apps",
    "page": { "route": "/", "locale": "en", "viewport": "desktop", "chat": "card",
              "activeSection": "header", "highlighted": null,
              "tools": ["highlightElement", "openContact", "scrollToSection", "switchLanguage"] } } ] }
```

Response 1:

```text
event: delta
data: {"text":"Scrolling to his apps."}

event: tool_call
data: {"id":"toolu_01A","name":"scrollToSection","input":{"section":"apps"}}

event: done
data: {"stopReason":"tool_use","usage":{"inputTokens":3510,"outputTokens":48,"cacheReadInputTokens":0,"cacheCreationInputTokens":0}}

```

Request 2 (follow-up after the client scrolled):

```json
{ "v": 2, "locale": "en", "messages": [
  { "role": "user", "content": "Show me his apps", "page": { "...": "as sent in request 1" } },
  { "role": "assistant", "content": "Scrolling to his apps.",
    "toolCalls": [ { "id": "toolu_01A", "name": "scrollToSection", "input": { "section": "apps" } } ] },
  { "role": "user", "toolResults": [ { "callId": "toolu_01A", "result": { "ok": true } } ] } ] }
```

Response 2: `delta` "Here they are: Cync, August Home and Savant." then `done` with `end_turn`.

## v3: the show dialect

> Final (GRA-41). Design: [`../retro/ARCHITECTURE.md`](../retro/ARCHITECTURE.md) §3–4, decision:
> [`../adr/0003-retro-live-fix-show.md`](../adr/0003-retro-live-fix-show.md). Types live in
> `src/data/retro/contract.ts` (wire) and `src/data/retro/scenario.ts` (scenario manifest); the
> blocks below are copies, the files win if they ever differ.

The Retro Rebuild show (the CV opens as a broken 2000s site and an "agent" fixes it live) uses
the same endpoint for its LLM parts: one **`narrate`** request per show for the commentary on
every step, and one **`reply`** request per visitor message in the show's terminal chat. The fix
steps themselves are authored and never chosen by the model.

**Why a new version:** v3 is a sibling dialect, not a successor of v2: the AI chat widget keeps
sending v2 and the server keeps serving v1, v2 and v3. `v` is the discriminator the contract
already versions by, so a deployment without v3 answers `400 unsupported_version` (the show then
runs scripted) instead of silently treating a show request as a chat (unknown fields are ignored).
Everything else is v1's: the endpoint, headers, Origin/size guards, rate limits, the kill switch,
the error body and codes, SSE framing and stream guarantees. The response header is
`X-Chat-Api-Version: 3`.

### What changes from v1

| Area | v3 |
|---|---|
| `v` | `3` |
| `locale` | Must be `"en"` (the show is English only); anything else: `400 invalid_request`. |
| `kind` | `"narrate"` or `"reply"`; anything else or missing: `400 invalid_request`. |
| `scenario` | The scenario id the page was built with (`RETRO_SCENARIO_ID`, today `"retro-1"`). A string the server doesn't know (a tab opened before a deploy that changed the steps): `400 unsupported_version`. Not a string: `400 invalid_request`. |
| `narrate` body | `v`, `locale`, `kind`, `scenario` only; other fields ignored. No conversation, no CV knowledge. |
| `reply` body | Adds `step` (the step on screen when the message was sent: a step id of the scenario, or `null` before the first step and after the last), `stepsDone` (integer, `0` to the number of steps) and `messages` (v1 shape and rules: roles alternate, start and end with `user`). A bad `step` or `stepsDone`: `400 invalid_request`. |
| Limits (`reply`) | `messages` 1 to **20** (10 visitor messages; more: `422 conversation_limit`); a `user` message at most **1,000** chars, an `assistant` message at most **1,000** chars (`413 too_long`); v1's total and body limits still apply. |
| SSE | `narrate`: `line`\* then `done`/`error`. `reply`: `delta`\* then `done`/`error` (as v1). No `tool_call`. |
| Errors | No new codes. |

### Stream

| Kind | Event | `data` | When |
|---|---|---|---|
| `narrate` | `line` | `{ "key": RetroNarrationKey, "text": string }` | Once per complete line the model wrote, in the model's order. `key` is a step id or `"finale"`; unknown keys and repeats (first occurrence wins) are dropped; `text` is plain text, trimmed, at most **200** chars. Some keys may never arrive. |
| `reply` | `delta` | `{ "text": string }` | As v1: the next piece of the answer. |
| both | `done` | `{ "stopReason": ChatStopReason, "usage": ChatUsage }` | Terminal, as v1. For `narrate`, `max_tokens` means the lines so far are all there is. |
| both | `error` | `ChatError` | Terminal, as v1 (`upstream_error`, `internal_error`). Lines already streamed stay valid. |

Client behaviour (the show never waits on the LLM):

- A step without a `line` uses its manifest `fallback`; the finale uses `RETRO_FINALE_FALLBACK`.
  The show fires `narrate` once, at its start, and never retries it.
- Any error on `narrate` (before or during the stream), and automation (`navigator.webdriver`):
  the whole show is scripted, with the same timing.
- An error on `reply`: a scripted reply. After `unavailable` or `rate_limited`, or two failed
  replies in a row, replies stay scripted for the rest of the show.
- Each request is one `POST` for the rate limits; `CHAT_ENABLED=false` answers `503 unavailable`
  to both kinds.

Server side (informational): `narrate` asks for one line per step plus the finale, at most 20
words each, `max_tokens` 800, 20 s deadline. `reply` answers in at most 60 words, grounded in the
CV like the chat, with the show state (`step`, `stepsDone`, number of steps) passed to the model as
data, `max_tokens` 300, the normal deadline. The log line carries `v: 3`, the kind, the step id and
the number of narration lines, never text.

### Types

`src/data/retro/scenario.ts` (the ids; titles, intents and fallbacks are in the file):

```ts
export const RETRO_SCENARIO_ID = 'retro-1';
export type RetroScenarioId = typeof RETRO_SCENARIO_ID;

export const RETRO_STEP_IDS = ['tokens', 'layout', 'rest'] as const;
export type RetroStepId = (typeof RETRO_STEP_IDS)[number];

export const RETRO_NARRATION_KEYS = [...RETRO_STEP_IDS, 'finale'] as const;
export type RetroNarrationKey = (typeof RETRO_NARRATION_KEYS)[number];
```

`src/data/retro/contract.ts` (`ChatError`, `ChatMessage`, `ChatStopReason`, `ChatUsage` are v1's):

```ts
export const CHAT_API_VERSION_V3 = 3;

export const RETRO_LIMITS = {
  maxMessages: 20,
  maxVisitorMessageChars: 1_000,
  maxAssistantMessageChars: 1_000,
  maxNarrationLineChars: 200,
} as const;

export interface ShowNarrateRequest {
  v: typeof CHAT_API_VERSION_V3;
  locale: 'en';
  kind: 'narrate';
  scenario: RetroScenarioId;
}

export interface ShowReplyRequest {
  v: typeof CHAT_API_VERSION_V3;
  locale: 'en';
  kind: 'reply';
  scenario: RetroScenarioId;
  step: RetroStepId | null;
  stepsDone: number;
  messages: ChatMessage[];
}

export type ShowRequest = ShowNarrateRequest | ShowReplyRequest;
export type ShowKind = ShowRequest['kind'];

export interface ShowSsePayloads {
  line: { key: RetroNarrationKey; text: string };
  delta: { text: string };
  done: { stopReason: ChatStopReason; usage: ChatUsage };
  error: ChatError;
}
export type ShowSseEventName = keyof ShowSsePayloads;

/** App-side stream events (what `ShowRepository` yields). */
export type ShowNarrateStreamEvent =
  | { type: 'line'; key: RetroNarrationKey; text: string }
  | { type: 'done'; stopReason: ChatStopReason; usage: ChatUsage }
  | { type: 'error'; error: ChatError };
export type ShowReplyStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; stopReason: ChatStopReason; usage: ChatUsage }
  | { type: 'error'; error: ChatError };
```

### Example: narrate, then one reply

Request 1, when the show starts:

```json
{ "v": 3, "locale": "en", "kind": "narrate", "scenario": "retro-1" }
```

Response 1:

```text
event: line
data: {"key":"tokens","text":"Starting with typography: replacing the system fonts of the time with the current typeface and type scale."}

event: line
data: {"key":"layout","text":"Layout: replacing the fixed-width table layout, standard practice at the time, with a centred column and grids."}

event: line
data: {"key":"rest","text":"Removing the navigation bar, marquee and footer badges of the original build, and restoring the language switcher."}

event: line
data: {"key":"finale","text":"All changes are applied. The site is up to date; the chat button in the bottom right corner answers questions about Andrew."}

event: done
data: {"stopReason":"end_turn","usage":{"inputTokens":1480,"outputTokens":92,"cacheReadInputTokens":0,"cacheCreationInputTokens":0}}

```

Request 2, the visitor writes during step 2:

```json
{ "v": 3, "locale": "en", "kind": "reply", "scenario": "retro-1",
  "step": "layout", "stepsDone": 1,
  "messages": [ { "role": "user", "content": "wow, a marquee! haven't seen one in 20 years" } ] }
```

Response 2: `delta` "It belongs to the 2002 layout. It goes in the cleanup step, with the hit counter." then `done` with `end_turn`.
