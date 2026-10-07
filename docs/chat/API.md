# AI CV chat: API contract (v4 the page chat, v3 the show)

The contract between the chat widget (`src/data/chat/**`, `src/screens/chat/**`) and the backend
(`api/chat.ts` + `server/chat/**`). The site is one page, English only (ADR-0006). **The server
serves exactly two versions**:

- **v4**: the chat of the one v3 CV page, with three page tools ([below](#v4-the-one-page-chat));
- **v3**: the Show case's narration and agent chat ([below](#v3-the-show-dialect)).

Any other `v` gets `400 unsupported_version`. The [shared rules](#shared-rules-v3-and-v4)
(request body, base types, headers, limits, SSE, errors, versioning) apply to both. If this file
and `src/data/chat/contract.ts` / `src/data/retro/contract.ts` ever disagree, the code wins.
Earlier versions (v1 text chat, v2 page tools on two pages): see git history of this file before
CV-141; decisions in the ADRs below.

Design context: [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md), [`AGENT.md`](AGENT.md); decisions:
[`../adr/0001-ai-cv-chat.md`](../adr/0001-ai-cv-chat.md) (the chat),
[`../adr/0002-page-agent-tools.md`](../adr/0002-page-agent-tools.md) (page tools),
[`../adr/0006-one-page-v3.md`](../adr/0006-one-page-v3.md) (one page, English only, v4).

## Summary

| | |
|---|---|
| Endpoint | `POST /api/chat` (same origin as the site; no CORS) |
| Request | JSON: `v` (4 or 3) and the whole conversation in `messages` (the server is stateless); v4: each question carries a page snapshot; v3: `locale` `"en"`, `kind`, `scenario` |
| Success | `200`, `text/event-stream`: `delta`\* (v3 `narrate`: `line`\*) then exactly one terminal event, `done` or `error`; v4 may also stream `tool_call` events and end with `stopReason: 'tool_use'` |
| Failure before the stream | non-2xx with a JSON body `{ "error": ChatError }` |
| Version | `v` in the body (3 or 4; see [Versioning](#versioning)); response header `X-Chat-Api-Version` with the same number |
| Types | `src/data/chat/contract.ts` (shared parts and v4), `src/data/chat/agentTools.ts` (v4 catalogue), `src/data/retro/contract.ts` (v3), shared by `src/` and `server/` |

## v4: the one-page chat

> Decision: [`../adr/0006-one-page-v3.md`](../adr/0006-one-page-v3.md) → Decision 3 (the tool
> dialect itself: [`../adr/0002-page-agent-tools.md`](../adr/0002-page-agent-tools.md)). Types
> live in `src/data/chat/contract.ts` (wire) and `src/data/chat/agentTools.ts` (catalogue); the
> blocks below are copies, the files win if they ever differ.

The site has one page (`/`; `/new` redirects to it) and one language (English). The visitor asks
about Andrew and can ask the chat to operate the page; the model calls typed page tools that the
browser runs (design: [`AGENT.md`](AGENT.md)). The tool dialect was first defined by v2 (retired),
so its types keep the `V2` names.

### Request and messages

| Area | v4 |
|---|---|
| `v` | `4`; response header `X-Chat-Api-Version: 4`. |
| Body | `v` and `messages`; other fields (e.g. a `locale` or `page` from an old client) are ignored. |
| Question | `{ role: 'user', content, page }`: the visitor's text + the page snapshot at send time (`AgentPageStateV4`, kept in the history and echoed verbatim). `activeSection` is one of `CV_SECTION_IDS` or `null`; `highlighted` one of the catalogue's targets or `null`; `tools` a sorted subset of the catalogue's names; at most 1,000 chars as JSON. |
| Tool-call turn | `{ role: 'assistant', content, toolCalls, providerState? }`: `content` may be empty when `toolCalls` is present; `providerState` is opaque and echoed verbatim. |
| Tool results | `{ role: 'user', toolResults }`, right after the assistant message with `toolCalls`, one result per call id, same order. |
| Roles | Alternate, start with a question, end with a `user` message (question or results). |
| Limits | `CHAT_LIMITS_V2`: `maxMessages` **40** (`422 conversation_limit` above); at most **10** questions; per-question and total char limits as in the [shared rules](#conversation-rules-and-limits); `page` at most 1,000 chars as JSON; `providerState` at most 16,384 chars; at most 3 `toolCalls` per assistant message; at most 2 consecutive tool rounds after the last question (the server then answers with tools disabled). |
| Tools | The server always sends the full catalogue (`buildCvPageToolSpecs`, below) to the model. The client never sends tool definitions. |
| Knowledge | `src/data/cv/cvPage.json` rendered by `renderCvPage` as `<document id="cv" title="CV">`; one block, so one cached prefix. |
| System prompt | `INSTRUCTIONS`, `PAGE_TOOL_INSTRUCTIONS`, knowledge (cache marker), `Site language: English (en).`. The model replies in the language of the visitor's latest message, English as the fallback. `PROMPT_VERSION` is bumped on every change. |
| Errors | No codes of its own: shape violations are `400 invalid_request`; the daily budget stop is `503 unavailable` with `retryAfterSeconds`. |
| Log line | `v: 4`, `locale: null` and the tool fields (`SYSTEM_DESIGN.md` §10). |

**Why a version of its own:** the enums of the two-page v2 (sections, target kinds, contact
channels, `switchLanguage`) no longer exist, and the request lost `page` and `locale`: breaking by
[Versioning](#versioning). An old tab gets `unsupported_version` and the widget's "reload" notice.

### Stream

| Event | `data` | When |
|---|---|---|
| `delta` | `{ "text": string }` | Zero or more times, as in the [shared stream](#success-response-sse-stream) (usually one short sentence before a tool call). |
| `tool_call` | `AgentToolCall` | Once per completed `tool_use` block, in order. |
| `done` | `{ stopReason, usage, providerState? }` | Terminal. With `stopReason: 'tool_use'` the client executes the calls **after** `done`, then posts a follow-up with the assistant turn and the results appended. |
| `error` | `ChatError` | Terminal, as in the shared stream. The client runs no tool from a stream that ended in `error`. |

### Types

`src/data/chat/contract.ts`, after the shared block:

```ts
/** The tool dialect's limits: the char limits above plus the tool-loop caps. */
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
export const AGENT_TOOL_NAMES = ['highlightElement', 'openContact', 'scrollToSection'] as const;
export type AgentToolName = (typeof AGENT_TOOL_NAMES)[number];

/** Target kinds on the page; item ids come from its JSON. `app` = a Transcenda project. */
export const AGENT_TARGET_KINDS = [
  'section',
  'impact',
  'experience',
  'app',
  'skill',
  'book',
  'contact',
] as const;
export type AgentTargetKind = (typeof AGENT_TARGET_KINDS)[number];

/** `<kind>:<id>`, the value of the target element's `data-agent-id`. */
export type AgentTargetId = `${AgentTargetKind}:${string}`;

export const AGENT_VIEWPORTS = ['desktop', 'mobile'] as const;
/** The chat widget's layout: floating card (desktop) or full-screen sheet (under 600 px). */
export const AGENT_CHAT_LAYOUTS = ['card', 'sheet'] as const;

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

/** `tool_use`: the client runs the streamed calls, then posts the results in a follow-up. */
export type ChatStopReasonV2 = ChatStopReason | 'tool_use';

export interface ChatSsePayloadsV2 {
  delta: { text: string };
  tool_call: AgentToolCall;
  done: { stopReason: ChatStopReasonV2; usage: ChatUsage; providerState?: string };
  error: ChatError;
}
export type ChatSseEventNameV2 = keyof ChatSsePayloadsV2;

/** Stream events for the app; tool calls run only after `done` with `stopReason: 'tool_use'`. */
export type ChatStreamEventV2 =
  | { type: 'delta'; text: string }
  | ({ type: 'tool_call' } & AgentToolCall)
  | { type: 'done'; stopReason: ChatStopReasonV2; usage: ChatUsage; providerState?: string }
  | { type: 'error'; error: ChatError };

export const CHAT_API_VERSION_V4 = 4;

/** The page's sections in page order; `data-agent-id="section:<id>"`. */
export const CV_SECTION_IDS = [
  'header',
  'craft',
  'loop',
  'impact',
  'experience',
  'skills',
  'education',
  'about',
  'contacts',
] as const;
export type CvSectionId = (typeof CV_SECTION_IDS)[number];

/** `CvPage.contacts` ids, in the header's order; `data-agent-id="contact:<channel>"`. */
export const CV_CONTACT_CHANNELS = ['email', 'whatsapp', 'linkedin'] as const;
export type CvContactChannel = (typeof CV_CONTACT_CHANNELS)[number];

/** Page snapshot sent with each question: enums and booleans only, never text or values. */
export interface AgentPageStateV4 {
  viewport: (typeof AGENT_VIEWPORTS)[number];
  chat: (typeof AGENT_CHAT_LAYOUTS)[number];
  activeSection: CvSectionId | null;
  highlighted: AgentTargetId | null;
  /** Tools registered (mounted) right now, sorted. */
  tools: AgentToolName[];
}

export interface ChatUserMessageV4 {
  role: 'user';
  /** Plain text, non-empty after trimming. */
  content: string;
  page: AgentPageStateV4;
}

/** Tool results and assistant messages are the tool dialect's (`V2` names). */
export type ChatMessageV4 = ChatUserMessageV4 | ChatToolResultsMessageV2 | ChatAssistantMessageV2;

/** Roles alternate, start with a text `user` message and end with a `user` message. */
export interface ChatRequestV4 {
  v: typeof CHAT_API_VERSION_V4;
  messages: ChatMessageV4[];
}
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
  /** Tools registered right now, sorted (`AgentPageStateV4.tools`). */
  available(): AgentToolName[];
  /** Never throws: invalid input → `invalid_params`, unmounted tool → `not_available`. */
  execute(call: AgentToolCall): Promise<AgentToolResult>;
}

/**
 * Every highlightable target of the one page (v4), `<kind>:<id>`: sections, then impact cards,
 * jobs, Transcenda's projects (`app:`), skill groups, books, contacts (header buttons), in data
 * order. 37 today.
 */
export declare function cvPageTargetIds(page: CvPage): AgentTargetId[];

/** The one page's catalogue (v4): deterministic (sorted by name, ids in data order). */
export declare function buildCvPageToolSpecs(page: CvPage): AgentToolSpec[];
```

Server side (informational): `LLM_TOOLS_V4`, built once from `cvPage.json`, maps each spec to an
Anthropic tool as `{ name, description, input_schema: inputSchema, strict: true }` (`confirm`
stays client-side); the knowledge loader for v4 takes no arguments; `validateV4` checks the
snapshot against `CV_SECTION_IDS` and the catalogue's targets and names. The show (v3) grounds its
replies in the same knowledge.

### Tool catalogue

`buildCvPageToolSpecs(page)`, each with one required string parameter restricted to an enum:

| Tool | Description (for the model) | Parameter | Enum | `confirm` |
|---|---|---|---|---|
| `highlightElement` | Scroll to a section or item of the page and briefly highlight it, e.g. an impact card, a job, an app, a skill group, a book or a contact. | `target` (The element to highlight.) | `section:<CvSectionId>` (9), then `impact:` (3), `experience:` (9), `app:` (3, Transcenda's projects), `skill:` (6), `book:` (4) with the `CvPage` ids in data order, then `contact:<channel>` (3): 37 | `false` |
| `openContact` | Open a contact channel of Andrew (email, WhatsApp or LinkedIn). The visitor confirms first. | `channel` (The contact channel.) | `CV_CONTACT_CHANNELS` | `true` |
| `scrollToSection` | Scroll the page to a section. | `section` (The section to scroll to. craft = "Code craft × agentic process", loop = "How I build with agents", impact = "Selected impact", contacts = the closing call to action with every contact.) | `CV_SECTION_IDS` in page order | `false` |

Item ids are the `id` fields of `ImpactCard`, `CvJob`, `CvProject`, `SkillGroup`, `Book` and
`CvContact` (`src/data/cvPage.ts`, ADR-0006 → Decision 1), checked by `cvPageIds.test.ts`. On the
page they are `data-agent-id` attributes the home screen sets (`agentTargetProps`); the
`contact:` targets are the header's buttons, the footer's pills carry none. A call with a value
outside the enum (e.g. from a tab opened before a deploy that changed the data) gets
`invalid_params` and nothing runs.

### Example: one tool round

Request 1 (the visitor asks):

```json
{ "v": 4, "messages": [
  { "role": "user", "content": "Show his selected impact",
    "page": { "viewport": "desktop", "chat": "card", "activeSection": "header",
              "highlighted": null,
              "tools": ["highlightElement", "openContact", "scrollToSection"] } } ] }
```

Response 1:

```text
event: delta
data: {"text":"Scrolling to his selected impact."}

event: tool_call
data: {"id":"toolu_01C","name":"scrollToSection","input":{"section":"impact"}}

event: done
data: {"stopReason":"tool_use","usage":{"inputTokens":3650,"outputTokens":48,"cacheReadInputTokens":0,"cacheCreationInputTokens":0}}

```

Request 2 (follow-up after the client scrolled):

```json
{ "v": 4, "messages": [
  { "role": "user", "content": "Show his selected impact", "page": { "...": "as sent in request 1" } },
  { "role": "assistant", "content": "Scrolling to his selected impact.",
    "toolCalls": [ { "id": "toolu_01C", "name": "scrollToSection", "input": { "section": "impact" } } ] },
  { "role": "user", "toolResults": [ { "callId": "toolu_01C", "result": { "ok": true } } ] } ] }
```

Response 2: `delta` "Here are his three selected results." then `done` with `end_turn`.

A body with another `v` (here a stale tab on the retired v2):

```text
HTTP/1.1 400 Bad Request
X-Chat-Api-Version: 4

{"error":{"code":"unsupported_version","message":"Unsupported version v=2","retryable":false,"requestId":"..."}}
```

### Size (built, CV-109)

Measured on the built request (`buildLlmRequest` with `cvPage.json`), characters as sent; tokens
estimated at 3.5 chars/token (the knowledge loader's rule) until the real `count_tokens` check:

| Block | Chars | ≈ Tokens |
|---|---|---|
| Knowledge (`<knowledge>` with `<document id="cv" title="CV">`) | 7,005 | 2,000 |
| Tools JSON (3 tools, 38 targets at the time) | 1,981 | 570 |
| `INSTRUCTIONS` + `PAGE_TOOL_INSTRUCTIONS` + site-language line | 3,757 | 1,070 |

Static prefix: about **12,750 chars ≈ 3,650 tokens**, plus Anthropic's tool-use system prompt
(a few hundred tokens), so **≈ 4,000 tokens**, one per model. On Haiku 4.5 it is just under the
4,096-token cache minimum; the automatic marker caches it once the history passes that. About
$0.004 per uncached request on Haiku. The exact count (`count_tokens`) and the golden check run
with the real model when CV-45 runs (ADR-0006 action 3).


## v3: the show dialect

> Design: [`../retro/ARCHITECTURE.md`](../retro/ARCHITECTURE.md) §3–4, decision:
> [`../adr/0003-retro-live-fix-show.md`](../adr/0003-retro-live-fix-show.md). Types live in
> `src/data/retro/contract.ts` (wire), `src/data/retro/scenario.ts` and `scenarios.ts` (scenario
> manifest); the blocks below are copies, the files win if they ever differ.

The Retro Rebuild show (the CV opens as a broken 2000s site and an "agent" fixes it live) uses
the same endpoint for its LLM parts: one **`narrate`** request per show for the commentary on
every step, and one **`reply`** request per visitor message in the show's agent chat. The fix
steps themselves are authored and never chosen by the model.

**Why a version of its own:** v3 is a sibling dialect, not a successor of v4. `v` is the
discriminator the contract versions by, so a deployment without v3 answers
`400 unsupported_version` (the show then runs scripted) instead of silently treating a show
request as a chat (unknown fields are ignored). Everything else is the
[shared rules](#shared-rules-v3-and-v4): the endpoint, headers, Origin/size guards, rate limits,
the kill switch, the error body and codes, SSE framing and stream guarantees. The response header
is `X-Chat-Api-Version: 3`.

### Request

| Area | v3 |
|---|---|
| `v` | `3` |
| `locale` | Must be `"en"` (the show is English only); anything else: `400 invalid_request`. |
| `kind` | `"narrate"` or `"reply"`; anything else or missing: `400 invalid_request`. |
| `scenario` | A known scenario id, the one the page was built with: `retro-4` (`ShowScenarioId`, the keys of `SHOW_SCENARIOS` in `src/data/retro/scenarios.ts`). A string the server doesn't know (a tab opened before a deploy that changed the steps): `400 unsupported_version`. Not a string: `400 invalid_request`. |
| `narrate` body | `v`, `locale`, `kind`, `scenario` only; other fields ignored. No conversation, no CV knowledge. |
| `reply` body | Adds `step` (the step on screen when the message was sent: a step id of the scenario, or `null` before the first step and after the last), `stepsDone` (integer, `0` to the number of steps) and `messages` (the shared `ChatMessage` shape and conversation rules: roles alternate, start and end with `user`). A bad `step` or `stepsDone`: `400 invalid_request`. |
| Limits (`reply`) | `messages` 1 to **20** (10 visitor messages; more: `422 conversation_limit`); a `user` message at most **1,000** chars, an `assistant` message at most **1,000** chars (`413 too_long`); the shared total and body limits still apply. |
| SSE | `narrate`: `line`\* then `done`/`error`. `reply`: `delta`\* then `done`/`error` (the shared stream). No `tool_call`. |
| Errors | No codes of its own. |

### Stream

| Kind | Event | `data` | When |
|---|---|---|---|
| `narrate` | `line` | `{ "key": RetroNarrationKey, "text": string }` | Once per complete line the model wrote, in the model's order. `key` is a step id or `"finale"`; unknown keys and repeats (first occurrence wins) are dropped; `text` is plain text, trimmed, at most **200** chars. Some keys may never arrive. |
| `reply` | `delta` | `{ "text": string }` | As in the shared stream: the next piece of the answer. |
| both | `done` | `{ "stopReason": ChatStopReason, "usage": ChatUsage }` | Terminal, as in the shared stream. For `narrate`, `max_tokens` means the lines so far are all there is. |
| both | `error` | `ChatError` | Terminal (`upstream_error`, `internal_error`). Lines already streamed stay valid. |

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
CV page's knowledge like the page chat, with the show state (`step`, `stepsDone`, number of steps)
passed to the model as data, `max_tokens` 300, the normal deadline. The log line carries `v: 3`,
the kind, the step id and the number of narration lines, never text.

### Types

`src/data/retro/scenario.ts` and `scenarios.ts` (the ids; titles, intents and fallbacks are in the
files):

```ts
/** Bump whenever the steps change: the server answers an unknown id with `unsupported_version`. */
export const RETRO_SCENARIO_ID = 'retro-4';
export type ShowScenarioId = keyof typeof SHOW_SCENARIOS; // 'retro-4'

export const RETRO_STEP_IDS = [
  'fonts', 'colours', 'layout', 'images', 'cards', 'spacing', 'chrome', 'links',
] as const;
export type RetroStepId = (typeof RETRO_STEP_IDS)[number];

export const RETRO_NARRATION_KEYS = [...RETRO_STEP_IDS, 'finale'] as const;
export type RetroNarrationKey = (typeof RETRO_NARRATION_KEYS)[number];
```

`src/data/retro/contract.ts` (`ChatError`, `ChatMessage`, `ChatStopReason`, `ChatUsage` are the
[shared types](#types-shared)):

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
  scenario: ShowScenarioId;
}

export interface ShowReplyRequest {
  v: typeof CHAT_API_VERSION_V3;
  locale: 'en';
  kind: 'reply';
  scenario: ShowScenarioId;
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
{ "v": 3, "locale": "en", "kind": "narrate", "scenario": "retro-4" }
```

Response 1:

```text
event: line
data: {"key":"fonts","text":"Starting with typography: the current typeface and type scale, so the headline, the stats and the impact figures read at a glance."}

event: line
data: {"key":"layout","text":"Layout: replacing the fixed-width table layout, standard practice at the time, with a centred column and grids."}

event: line
data: {"key":"chrome","text":"Removing the navigation bar, marquee and footer badges of the original build, and restoring the meta bar."}

event: line
data: {"key":"finale","text":"All changes are applied. The site is up to date; the chat button in the bottom right corner answers questions about Andrew."}

event: done
data: {"stopReason":"end_turn","usage":{"inputTokens":1480,"outputTokens":92,"cacheReadInputTokens":0,"cacheCreationInputTokens":0}}

```

Request 2, the visitor writes during step 3:

```json
{ "v": 3, "locale": "en", "kind": "reply", "scenario": "retro-4",
  "step": "layout", "stepsDone": 2,
  "messages": [ { "role": "user", "content": "wow, a marquee! haven't seen one in 20 years" } ] }
```

Response 2: `delta` "It belongs to the 2002 layout. It goes in the cleanup step, with the hit counter." then `done` with `end_turn`.


## Shared rules (v3 and v4)

Request body, base types, headers, limits, framing and errors below apply to both served versions
unless a dialect section overrides them (v4: `CHAT_LIMITS_V2`, 40 messages and 10 questions, plus
the `tool_call` event; v3 `reply`: see its table).

### Request body

| Field | Rule |
|---|---|
| `v` | Missing or not a number: `400 invalid_request`. A number other than `3` or `4`: `400 unsupported_version`. |
| `messages` | The whole conversation, oldest first, in the dialect's shapes; rules below. |
| `messages[].content` | Plain text; a visitor's text must be non-empty after trimming. |
| other fields | Ignored (forward compatibility: a newer client may send additive fields). |

### Types (shared)

`src/data/chat/contract.ts`, framework-free (no React, DOM, Vite or Node imports) because
`server/chat/**` imports it too:

```ts
export const CHAT_API_PATH = '/api/chat';
export const CHAT_API_VERSION_HEADER = 'X-Chat-Api-Version';
export const CHAT_REQUEST_ID_HEADER = 'X-Request-Id';

/** Request limits; lengths are `String.length`. Exceeding one is `too_long` (or `conversation_limit`). */
export const CHAT_LIMITS = {
  maxMessages: 20,
  maxUserMessageChars: 1_000,
  maxAssistantMessageChars: 4_000,
  maxTotalChars: 24_000,
  maxBodyBytes: 131_072,
} as const;

export type ChatRole = 'user' | 'assistant';

/** A plain text message (the show's `reply` conversation). */
export interface ChatMessage {
  role: ChatRole;
  /** Plain text, non-empty after trimming. */
  content: string;
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
```

### Request headers

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

### Conversation rules and limits

The base (`CHAT_LIMITS`); v3 `reply` uses it with the changes in its table, v4 widens it to
`CHAT_LIMITS_V2` (see its section).

(`400 invalid_request` unless stated otherwise):

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
| All `content` together | **24,000** chars | The client offers a new chat at the message cap first. |
| Request body | **131,072** bytes (128 KiB) | Checked from `Content-Length` and while reading. |

### Success response: SSE stream

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache, no-transform
X-Accel-Buffering: no
X-Chat-Api-Version: 4
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
  - `refusal`: the model's safety system declined. The UI shows a polite notice; the message is
    kept in the history as streamed (it may be empty).
  - `tool_use` (v4 only): see the v4 stream.
- `usage` is informational (the widget does not show it); tests and dev tools may.

A stream that fails midway ends with:

```text
event: error
data: {"code":"upstream_error","message":"Upstream stream failed: overloaded","retryable":true,"requestId":"3f0c9a4e-..."}

```

### Error response (before the stream)

Any non-2xx response. The body is JSON unless it came from the platform (see the last rows).

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json; charset=utf-8
Cache-Control: no-store
Retry-After: 42
X-Chat-Api-Version: 4
X-Request-Id: 9b1d...

{ "error": { "code": "rate_limited", "message": "Too many messages. Try again in a minute.", "retryable": true, "retryAfterSeconds": 42, "requestId": "9b1d..." } }
```

`message` is English, for logs and developers only. The widget shows its own text per `code`
(strings in `src/screens/chat/strings.ts`).

| Status | `code` | `retryable` | Cause |
|---:|---|---|---|
| 400 | `invalid_request` | false | Malformed JSON, schema or conversation-rule violation. |
| 400 | `unsupported_version` | false | `v` is a number other than `3` or `4` (an outdated tab after a breaking release). The widget asks to reload the page. |
| 403 | `forbidden_origin` | false | `Origin` missing or not the site's host. |
| 405 | `method_not_allowed` | false | Not `POST` (header `Allow: POST`). |
| 413 | `too_long` | false | A length or body limit above. |
| 415 | `unsupported_media_type` | false | `Content-Type` is not JSON. |
| 422 | `conversation_limit` | false | More messages than the dialect allows (v4: 40 messages or an 11th question; v3 `reply`: 20). The widget offers "Start a new chat". |
| 429 | `rate_limited` | true | Per-IP limit (see below). `Retry-After` header (seconds) and `retryAfterSeconds`. |
| 500 | `internal_error` | true | Unexpected server bug. |
| 502 | `upstream_error` | per cause | Claude failed before the first byte: `true` for Anthropic 429/5xx/529, network, timeout; `false` for 4xx (bad key, bad model, spend limit reached). |
| 503 | `unavailable` | true | Chat switched off (`CHAT_ENABLED=false`), `ANTHROPIC_API_KEY` missing, the per-instance hourly cap is hit, or the daily budget is spent. `Retry-After` when known. |
| 429 (platform) | none (non-JSON) | true | The Vercel Firewall rate-limit rule. The client maps any `429` without a parsable body to `rate_limited` and reads `Retry-After` if present (default 60 s). |
| 5xx (platform) | none (non-JSON) | true | E.g. `504 FUNCTION_INVOCATION_TIMEOUT`. The client maps any unparsable non-2xx to `upstream_error` (`retryable: true` for 5xx, `false` otherwise). |

The same question with an 1,001-character text:

```text
HTTP/1.1 413 Payload Too Large
Content-Type: application/json; charset=utf-8
X-Chat-Api-Version: 4

{"error":{"code":"too_long","message":"messages[0].content exceeds 1000 characters","retryable":false,"requestId":"..."}}
```

Mid-stream `error` events use only `upstream_error` and `internal_error`.

Rate limits behind `rate_limited` (all per client IP, best effort; details in `SYSTEM_DESIGN.md`):
Vercel Firewall rule 30 requests / 10 min; in-function 8 requests / 60 s and 100 requests / 24 h.
All `POST`s count, valid or not.

### Versioning

- The version lives in the body (`v`) and the `X-Chat-Api-Version` response header; the path
  stays `/api/chat`. The site and the function deploy together, so skew only comes from tabs
  opened before a deploy (Vercel Skew Protection is not on Hobby).
- **Additive, non-breaking** changes keep `v`: new optional request fields (the server ignores
  unknown ones), new response fields, new SSE event names, new error codes (clients map unknown
  codes to a generic "Something went wrong" and treat them as `retryable: false`).
- **Breaking** changes bump `v`. The server then accepts the new and the previous version for at
  least one release and answers others with `400 unsupported_version`.

| `v` | What | Sent by |
|---|---|---|
| 3 | The show dialect (`narrate`, `reply`) | the Show case |
| 4 | The one-page chat (ADR-0006): page tools, no `page`, no `locale` | the chat widget |

v1 and v2 were retired in CV-114: a stale v1/v2 tab gets `400 unsupported_version` ("The chat has
been updated. Please reload the page.").
