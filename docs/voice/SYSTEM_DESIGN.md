# Voice agent: system design

> A visitor of the one CV page (`/`, English, ADR-0006) can talk to the CV's AI. A round mic
> button left of the "Ask my AI" pill opens a full-screen voice mode; the conversation runs on an
> **ElevenLabs agent** (speech in and out, turn taking, its own LLM); the agent can use the page
> tools; everything said lands in the chat conversation. Hidden behind a flag. Decisions:
> [ADR-0008](../adr/0008-voice-agent-elevenlabs.md); wire contract: [`API.md`](API.md); look and
> copy: `docs/design/voice/` (CV-147). Where this file and the code disagree, the code on `main`
> wins.

## 1. Requirements and constraints

| Kind | Requirement |
|---|---|
| Functional | Spoken Q&A about Andrew's professional profile, grounded only in the CV, in the visitor's language (auto-detected; the site stays English). Page tools by voice: `scrollToSection`, `highlightElement`, `openContact` (confirmed by a spoken yes or the on-screen button). Every final line of the call appears in the chat conversation, marked as voice. |
| Limits | At most **3 minutes per call** and **30 minutes per month** for all visitors together. |
| Rollout | Off by default: a client flag shows the mic button, a server switch allows tokens. |
| Security | The ElevenLabs API key never reaches the browser; only our endpoint can start a call; the visitor cannot change the agent's prompt, voice or tools. |
| Platform | Vercel Hobby, stateless functions, no DB/KV (ADR-0001); one new npm dependency (`@elevenlabs/client`), loaded lazily. |
| Testing | No test, e2e or CI job talks to ElevenLabs. |
| Out of scope | Voice in the Show case, a cloned voice, Custom LLM, recording or storing calls on our side. |

## 2. Architecture

```text
Browser
  src/screens/chat/   mic button + voice mode (orb, fog)  <- ChatUiState (voice call entry)
        | tap mic: requestMicrophone() -> create session -> start(token, handlers)
  src/screens/chat/voice/useVoiceCall.ts  (state holder: call status, lines, timer, tools)
        |                         ^ events: status, mode, line, correction, ended
        | VoiceSessionRepository  | VoiceClient (interface)
  src/data/voice/HttpVoiceSessionRepository.ts   src/data/voice/ElevenLabsVoiceClient.ts
        |  POST /api/voice-session                 |  lazy import('@elevenlabs/client')
        v                                          |  WebRTC (LiveKit) audio + events
Vercel Function api/voice-session.ts               |
  server/voice/handler.ts                          |
    1 guards: method, Origin, Content-Type, body cap, VOICE_ENABLED, key + agent id
    2 per-IP / per-instance limiter (server/chat/rateLimiter.ts, voice limits)
    3 production only, once per instance: sync agent prompt + tools (§6)
    4 month's minutes: list conversations since the 1st (§5) -> 503 quota_exhausted
    5 GET /v1/convai/conversation/token -> 200 { conversationToken, maxCallSeconds }
        |  HTTPS, xi-api-key                       v
        +---------------------------------> ElevenLabs Agents (agent: prompt, CV knowledge,
                                             3 client tools, language detection, end_call,
                                             max 180 s, concurrency 1, auth required)
  page tools: agent -> client tool call -> useVoiceCall -> chat's AgentToolExecutor
              -> src/agent/ registry -> home screen executors -> result back to the agent
```

Principles: as in the text chat, the UI knows only interfaces (`VoiceClient`,
`VoiceSessionRepository`) and state; `@elevenlabs/client` is imported in exactly one file and
`server/` talks to ElevenLabs with plain `fetch` (no server SDK). The server never sees audio or
transcripts; it only mints tokens, counts minutes and keeps the agent's config in sync.

## 3. Pieces and layers

| Layer | Path | Responsibility |
|---|---|---|
| Contract | `src/data/voice/contract.ts` | `API.md` types and constants, framework-free, shared with `server/`. |
| Data | `src/data/voice/VoiceClient.ts` | The interface below; no SDK types leak out of it. |
| Data | `src/data/voice/ElevenLabsVoiceClient.ts` | The only importer of `@elevenlabs/client` (dynamic `import()`, so the SDK and `livekit-client` form a lazy chunk). Maps SDK callbacks to `VoiceCallEvent`s, registers one client tool per catalogue name, self-hosts the audio worklets (`workletPaths` with Vite `?url&no-inline` imports of `@elevenlabs/client/worklets/*`: a plain `?url` inlines these small files as `data:` URLs, which CSP `script-src 'self'` blocks). |
| Data | `src/data/voice/FakeVoiceClient.ts` | Scripted calls for unit tests, e2e and `?voice=fake`: greeting, a visitor line, a tool call, an answer, an interruption correction, an end; no network, no microphone. |
| Data | `src/data/voice/HttpVoiceSessionRepository.ts` (+ context) | `POST /api/voice-session`; never throws: `{ ok: true, session } \| { ok: false, error }`, non-JSON platform errors mapped like `HttpChatRepository`. |
| App | `src/app/voiceMode.ts`, `src/app/AppProviders.tsx` | Reads the flag (§9) and binds `ElevenLabsVoiceClient`, `FakeVoiceClient` or none (no mic button). |
| Screen | `src/screens/chat/voice/` | `useVoiceCall` (state holder), the mic button, the voice mode (orb, fog, timer, confirmation card, end button), strings in the chat's `strings.ts`, test ids, tests. Lives in the chat screen because the transcript is the chat's conversation and screens may not import each other. |
| Agent | `src/agent/` (unchanged) | Executes the agent's tool calls through the chat's executor. |
| Entry | `api/voice-session.ts` | ~10 lines: build deps once per instance, call `handleVoiceSession`. |
| Server | `server/voice/handler.ts`, `config.ts`, `log.ts` | The pipeline of §2; env read once; one log line per request. |
| Server | `server/voice/ElevenLabsApi.ts` | Interface + `fetch` implementation: `conversationToken`, `listConversations`, `getAgent`, `patchAgent`, `listTools`, `createTool`, `patchTool`; a fake for tests. 5 s timeout per call. |
| Server | `server/voice/monthUsage.ts` | §5's sum, pure over the listed conversations and a clock. |
| Server | `server/voice/prompt/voicePrompt.ts` | The voice instructions (§6), built from the shared rule blocks of `server/chat/prompt/systemPrompt.ts`. |
| Server | `server/voice/agentConfig.ts`, `agentSync.ts` | Pure builder of the agent's prompt, first message, max duration and client tools from `CV_PAGE`; the once-per-instance sync (§6). |
| Dev | `server/dev/chatApiPlugin.ts` | Also mounts `/api/voice-session` for `npm run dev`. |

```ts
// src/data/voice/VoiceClient.ts
export type VoiceCallEvent =
  | { type: 'status'; status: 'connecting' | 'live' }
  | { type: 'mode'; mode: 'listening' | 'speaking' }
  /** A final transcript line; `id` is `visitor-<event id>` / `agent-<event id>`. */
  | { type: 'line'; line: { id: string; role: 'visitor' | 'agent'; text: string } }
  /** The visitor interrupted: the agent line was cut to what was actually spoken. */
  | { type: 'correction'; id: string; text: string }
  | { type: 'ended'; reason: 'visitor' | 'agent' | 'time_limit' | 'error'; message?: string };

export interface VoiceCallHandlers {
  onEvent(event: VoiceCallEvent): void;
  /** The agent called a page tool; resolves with the result the agent hears. */
  onToolCall(call: AgentToolCall): Promise<AgentToolResult>;
}

export interface VoiceCall {
  /** Hangs up; `ended` carries the reason (End button, or the client timer). */
  end(reason?: 'visitor' | 'time_limit'): Promise<void>;
  /** 0..1 input and output loudness for the orb, polled per animation frame. */
  levels(): { input: number; output: number };
  /** The SDK's mic mute (design: Mute button); the call stays live. */
  setMuted(muted: boolean): void;
  /** The SDK's contextual update, e.g. the 2:30 wrap-up hint (design: Orchestrator decision 3). */
  sendContextualUpdate(text: string): void;
}

export interface VoiceClient {
  /** Asks for the microphone (call from the mic tap); also starts fetching the SDK chunk. */
  requestMicrophone(): Promise<'granted' | 'denied'>;
  /** Connects with a fresh token; rejects if the connection fails, with no `ended` event
   *  after it: the caller ends the call as `error`. */
  start(session: VoiceSessionResponse, handlers: VoiceCallHandlers): Promise<VoiceCall>;
}
```

## 4. Call lifecycle

1. The mic button is shown only when the flag is on (§9). Tap: `useVoiceCall` opens the voice
   mode in `connecting` and calls `requestMicrophone()`. Denied → the "microphone blocked" state,
   nothing else happens.
2. `HttpVoiceSessionRepository.create()` → `POST /api/voice-session`. An error ends in the state
   for its code (`API.md` → Errors); no call starts.
3. `VoiceClient.start(session, handlers)`: WebRTC connect with the token; the SDK's `onConnect`
   → `status: live`; the agent says its first message. The client timer starts at
   `maxCallSeconds`.
4. During the call: `onModeChange` drives the orb (listening / speaking, loudness from
   `levels()`); every final `onMessage` (`role: 'user' | 'agent'`) becomes a `line`;
   `onAgentResponseCorrection` becomes a `correction`; client tool calls go to `onToolCall` (§7).
5. The call ends when the visitor taps End (`reason: visitor`), the timer reaches 0
   (`time_limit`; the state holder calls `end('time_limit')`, and the agent's own `max_duration_seconds: 180` ends
   it on ElevenLabs' side anyway), the agent hangs up (`end_call` tool, silence timeout) or the
   connection fails (`error`). The voice mode closes; the call stays in the chat as an entry with
   its lines and how it ended.
6. Closing the tab or navigating away ends the WebRTC session; ElevenLabs bills to that moment.

Only one call at a time: the mic button is disabled while a call is live, and the agent's
`agent_concurrency_limit: 1` refuses a second session from another visitor (that start fails →
`ended: error`, shown as "busy, try again in a few minutes").

## 5. Limits

| Layer | Setting | Holds |
|---|---|---|
| Client flag | Mic button only with `?voice=1` remembered (§9) | Hides the feature; not a security layer |
| Kill switch | `VOICE_ENABLED` must be `true` (unset = off) | All tokens, instantly after a redeploy |
| Same origin | `Origin` host = request host; no CORS | Other sites' browsers |
| Per IP (in function, per instance) | 2 sessions / 60 s, 10 / 24 h (`RateLimiter` with voice limits) | Casual abuse |
| Per instance | 30 sessions / hour, then `503 unavailable` | Bursts |
| **Per call** | Agent `max_duration_seconds: 180` (synced from `VOICE_MAX_CALL_SECONDS`) + client timer | Exact, on ElevenLabs' side |
| **Per month** | Endpoint sums the month's calls from ElevenLabs (below); token only if a full call fits | Exact across instances |
| Concurrency | Agent `call_limits.agent_concurrency_limit: 1`, `bursting_enabled: false` | Closes the race for the last slot |
| Per day | Agent `call_limits.daily_limit: 20` conversations | Backstop if the month check had a bug |
| Money | ElevenLabs plan credits with usage-based billing **off** | The hard cap, like the Anthropic spend limit |

**Month check** (`monthUsage.ts`), on every session request, failing closed:

```text
monthStart = 00:00 UTC on the 1st of the current month
list GET /v1/convai/conversations?agent_id=…&call_start_after_unix=monthStart&page_size=100
     (follow next_cursor; more than 5 pages → fail closed, upstream_error)
used = Σ per conversation:
         status done | failed | processing  → call_duration_secs
         status initiated | in-progress     → 180 if started < 15 min ago, else call_duration_secs
left = 1,800 − used
left < 180 → 503 quota_exhausted, retryAfterSeconds = seconds to 00:00 UTC on the 1st of next month
```

Counting a live or just-minted conversation as a full call keeps the cap exact while calls
overlap; a minted token that was never used stops counting after 15 minutes. The month ends with
up to 3 unused minutes, the price of never going over. The build ticket checks once against the
real API that a minted token's conversation shows up in the list right away (status
`initiated`); if it doesn't, the handler also counts the tokens this instance minted in the last
15 minutes.

In the UI: `quota_exhausted` shows the design's "voice is resting until next month" state with a
way into the text chat; the mic button stays (the visitor learns why). When the client timer has
30 s left, the voice mode shows the countdown (design).

Cost: ElevenLabs bills agent calls per minute from the plan's credits (LLM included at the plan's
rate). 30 minutes a month bounds it; the orchestrator records the plan and its price on the
project.

## 6. Knowledge, prompt and agent sync

**Prompt.** `server/chat/prompt/systemPrompt.ts` splits `INSTRUCTIONS` into exported blocks:
`KNOWLEDGE_RULES`, `SCOPE_RULES`, `SAFETY_RULES` (today's "Knowledge", "Scope", "Safety"
sections, verbatim) and the text-only intro and "Language and format". `INSTRUCTIONS` is rebuilt
from them byte for byte (a test pins the old string, so `PROMPT_VERSION` does not move). The
voice prompt (`voicePrompt.ts`, its own `VOICE_PROMPT_VERSION`) is:

1. Voice intro: "You are the voice assistant on Andrew Panasiuk's CV website. Visitors are mostly
   recruiters and engineers. You answer questions about Andrew's professional profile, speaking
   about him in the third person."
2. `KNOWLEDGE_RULES`, `SCOPE_RULES`, `SAFETY_RULES` (shared).
3. Voice style: reply in the language the visitor speaks (the `language_detection` tool switches
   the voice); one to three short spoken sentences; no lists, formatting, URLs or emoji; say the
   email address only when asked, slowly; if a transcript looks garbled, ask the visitor to
   repeat; when the visitor says goodbye, say goodbye and end the call.
4. Voice page rules (from `PAGE_TOOL_INSTRUCTIONS`, without `<page_state>`): use tools only when
   the visitor asks for something on the page; say in a few words what you do, then call the
   tool; never claim an action happened unless the result is `{"ok":true}`; on `not_available`
   say the page can't do that right now; on `unknown_target` or `invalid_params` say it didn't
   work; on `declined` acknowledge and don't ask again unless the visitor does. **`openContact`:
   first ask out loud ("Shall I open his LinkedIn?") and call it only after a clear yes; then
   say it opens now and that a tap on the screen may be needed.** Never read out contact links.
5. `<knowledge>…</knowledge>`: the output of the chat's knowledge loader (`renderCvPage` over
   `cvPageData.ts`), the same bytes the text chat sends.

**First message** (English; the agent switches language once the visitor speaks): "Hi, I'm the
voice assistant on Andrew's CV. Ask me about his experience, or ask me to show something on the
page." The exact text belongs to the design package if it sets one.

**Two prompts, one behaviour.** Text answers come from Claude (`CHAT_MODEL`), voice answers from
the agent's LLM (`claude-haiku-4-5` in ElevenLabs, the same family as the text default). They
share the rules and the knowledge by construction (a test asserts both prompts contain the shared
blocks and the same knowledge text); the differences are style (spoken vs written) and
`<page_state>` (voice has none: an unmounted tool answers `not_available`). A voice golden check
(§12) runs before release and after any prompt change.

**Sync** (`agentSync.ts`, ADR-0008 → Decision 4). Runs only when `VERCEL_ENV === 'production'`,
once per instance (a memoized promise, cleared on failure), before the first token:

1. Build the expected config: prompt (above), `first_message`, `max_duration_seconds: 180`,
   three client tools (§7).
2. `GET /v1/convai/agents/{id}` and `GET /v1/convai/tools`; find our tools by name.
3. Create a missing tool; `PATCH /v1/convai/tools/{id}` for a tool whose config differs;
   `PATCH /v1/convai/agents/{id}` when the prompt, first message, max duration or `tool_ids`
   differ. Compare normalised JSON of the fields we own only; leave everything else (voice,
   LLM, languages, limits, security) as the checklist set it.
4. Log `{"evt":"voice_sync","outcome":"unchanged"|"patched"|"failed","changed":[…]}`. A failure
   doesn't block the token: the call runs on the previous config and the next request retries.

Preview and dev never write the agent: a preview with voice on talks to the agent as production
last synced it.

## 7. Client tools

The catalogue is `buildCvPageToolSpecs(CV_PAGE)`; each `AgentToolSpec` maps to one ElevenLabs
client tool:

```json
{
  "type": "client",
  "name": "scrollToSection",
  "description": "Scroll the page to a section.",
  "parameters": {
    "type": "object",
    "required": ["section"],
    "properties": {
      "section": {
        "type": "string",
        "description": "The section to scroll to. craft = \"Code craft × agentic process\", loop = \"How I build with agents\", impact = \"Selected impact\", contacts = the closing call to action with every contact.",
        "enum": ["header", "craft", "loop", "impact", "experience", "skills", "education", "about", "contacts"]
      }
    }
  },
  "expects_response": true,
  "response_timeout_secs": 5,
  "execution_mode": "immediate",
  "pre_tool_speech": "auto",
  "interruption_mode": "allow"
}
```

| Tool | Parameter (enum from the catalogue) | `expects_response` | `response_timeout_secs` | Note |
|---|---|---|---|---|
| `highlightElement` | `target`: the 37 `cvPageTargetIds` | `true` | 5 | |
| `openContact` | `channel`: `email`, `whatsapp`, `linkedin` | `true` | 40 | Waits up to 30 s for the tap (below) |
| `scrollToSection` | `section`: `CV_SECTION_IDS` | `true` | 5 | |

Names, descriptions and enums are exactly the catalogue's; `additionalProperties` is dropped
(ElevenLabs' schema has no such field; the registry still rejects extra keys). The sync writes
them, so a CV edit that changes the target ids reaches the agent with the deploy.

**Execution.** `ElevenLabsVoiceClient` registers `clientTools[name] = (params) => …` for each
name. A call becomes an `AgentToolCall` `{ id: 'voice-<n>', name, input: params }`, goes to
`onToolCall`, and `useVoiceCall` runs it through the chat's `AgentToolExecutor` (the registry
validates and executes). The handler returns `JSON.stringify(result)`, i.e. `{"ok":true}` or
`{"ok":false,"error":"not_available"}`, which the agent reads. Each call appears as an action
chip in the call's transcript, as in the text chat. A visual action (scroll, highlight) needs
the page to be visible: the voice mode gets out of the way while it runs, as
`docs/design/voice/` specifies. Unknown tool names (an agent tool the client doesn't register)
are answered by the SDK at once with an error result, so the agent doesn't wait for a timeout.

**`openContact` by voice.** The agent asks first and calls the tool after a spoken yes (prompt
rule, §6). That yes is the visitor's confirmation. The executor then opens the contact at once
if the browser lets it (`mailto:` in place; `window.open(url, '_blank', 'noopener')` for
WhatsApp and LinkedIn). Browsers allow a new tab only right after a tap, so when `window.open`
returns `null` the voice mode shows the same confirmation card as the chat (text built from the
CV data, never from the model) with "Open <contact>" and Cancel. The tap opens it → `ok`; Cancel
or 30 s without a tap → `declined`. The confirmation logic lives in `useVoiceCall` next to the
chat's `useConfirmationDecisions`; `src/agent/` doesn't change.

## 8. Transcript into the chat

- **Model.** The chat's conversation becomes an ordered list of entries: a text turn (today's
  `ChatTurn`) or a **voice call** `{ id, status: 'connecting' | 'live' | 'ended', endReason?,
  error?, lines: { id, role: 'visitor' | 'agent', text, actions: ChatActionCall[] }[] }`. The
  reducer in `conversation.ts` gains the call actions (`callStart`, `callLine`,
  `callCorrection`, `callAction`, `callEnd`). Only final lines are stored; a `correction`
  replaces an agent line's text with what was actually spoken before the interruption.
- **Marked as voice.** The chat renders a call entry with its own marker (mic icon, "Voice call ·
  1:42") from `docs/design/voice/`; lines use the chat's message rows.
- **The text model doesn't see voice turns.** `buildHistory` keeps sending text turns only, so
  `v: 4` and its limits are unchanged and a call can't use up the text chat's 10 questions. After
  a call the visitor can keep typing; the text model sees the earlier text turns, not the call.
  "New chat" clears calls too. Like the text chat, the transcript lives in memory only (lost on
  reload).
- **Live view.** During a call the voice mode shows the agent's latest line (design); the
  full transcript is in the chat afterwards.

## 9. Feature flag and kill switch

| Switch | Where | Default | Effect |
|---|---|---|---|
| `?voice=1` | URL, remembered in `localStorage` (`cv.voice` = `1`) | off | Shows the mic button with the real client. `?voice=0` forgets it. |
| `?voice=fake` | URL, this page load only | off | Mic button with `FakeVoiceClient` (no microphone, no ElevenLabs): dev, e2e, web check screenshots. The endpoint is still called (mocked in e2e). |
| `VOICE_ENABLED` | Vercel env (Production, Preview), `.env.local` | unset = off | `true` lets the endpoint mint tokens; anything else is `503 unavailable` (the kill switch: set to `false` and redeploy). |
| `VOICE_FAKE` | `.env.local` only, ignored on Vercel | unset | `1`: the endpoint skips ElevenLabs and returns `{ conversationToken: "fake" }` after the same guards. |

Production starts with `VOICE_ENABLED=true` but no visible button (nobody has the flag). To
launch, a later ticket removes the client flag or makes it default on.

## 10. Security and privacy

- **Keys.** `ELEVENLABS_API_KEY` lives only in Vercel env (Sensitive). Restrict it to ElevenLabs
  Agents (the sync needs write access to the agent and its tools; no TTS, voices or other
  products). The token is the only secret the browser sees: single-use, for this agent only.
- **Agent.** `enable_auth: true` (tokens only), no allowlist (ElevenLabs: not together with
  signed tokens), every client override off (prompt, first message, language, voice, LLM), so a
  visitor can't turn the agent into a free general-purpose voice LLM.
- **Tools.** Enums only, executed by our registry; `openContact` needs a spoken yes and, where
  the browser requires it, a tap. Prompt injection by voice can at most scroll, highlight or ask
  to open a contact, as with typing.
- **Headers.** CSP `connect-src` gains `https://api.elevenlabs.io wss://api.elevenlabs.io
  https://livekit.rtc.elevenlabs.io wss://livekit.rtc.elevenlabs.io`; `script-src` stays
  `'self'` (worklets self-hosted, §3); Permissions-Policy `microphone=(self)`. Changed in
  `scripts/securityHeaders.ts` and `vercel.json` together (`e2e/securityHeaders.spec.ts`
  compares them). The build ticket verifies the list on a preview with a real call: any CSP
  violation in the console is a bug (e.g. the SDK falling back to a CDN for `libsamplerate`).
- **Privacy.** We store nothing. ElevenLabs keeps each conversation's transcript and metadata for
  `retention_days: 40` (the month check needs this month's list) with `record_voice: false` (no
  audio). The voice mode's first screen should say that the call is processed by ElevenLabs
  (design's copy).

## 11. Observability

One JSON line per session request, no IP, no transcript:

```json
{"evt":"voice_session","requestId":"7c1e...","v":1,"status":200,"outcome":"token",
 "errorCode":null,"limiter":"ok","monthSecondsUsed":540,"monthSecondsLeft":1260,
 "conversationId":"conv_...","agentSync":"unchanged","durationMs":420,"country":"DE"}
```

Durable truth: the ElevenLabs dashboard (conversations, minutes, credits). The month's
minutes are also readable with the same list call the endpoint makes.

## 12. Testing

No test or CI job talks to ElevenLabs: the server test setup deletes `ELEVENLABS_API_KEY`,
`ELEVENLABS_AGENT_ID` and `VOICE_*`; the server uses the `ElevenLabsApi` fake; the browser uses
`FakeVoiceClient`; lint keeps `@elevenlabs/*` in one file; e2e mocks `/api/voice-session`.

| Level | What | Where |
|---|---|---|
| Server unit | `monthUsage` (statuses, 15-min rule, boundary 1,620 / 1,621 s used, pagination, 6th page fails closed); `handleVoiceSession` with the fake API (each error code and header, kill switch, missing env, limiter, quota, upstream errors, fail closed on a list error, one log line); `agentConfig` (deterministic, tool enums = catalogue, prompt contains the shared blocks and the knowledge); `agentSync` (no-op when equal, patch per changed field, create missing tool, production only, failure retried); `INSTRUCTIONS` byte-identical after the split | `server/voice/**/*.test.ts`, `server/chat/prompt/*.test.ts` |
| Contract | `HttpVoiceSessionRepository` against `handleVoiceSession` in one process (success, JSON error, platform `429`/`5xx` without body) | `server/voice/contract.test.ts` |
| Client unit | `ElevenLabsVoiceClient` mapping with a stubbed SDK module (events, tool registration, result strings, corrections); `FakeVoiceClient` script; `voiceMode` parsing | `src/data/voice/*.test.ts`, `src/app/voiceMode.test.ts` |
| Screen | `useVoiceCall` + chat reducer: lines into the conversation, `buildHistory` without voice, tools through a fake executor, `openContact` (opened, blocked → card → tap / cancel / timeout), timer end, mic denied, each session error state; UI: no button without the flag, the voice mode's states | `src/screens/chat/voice/*.test.tsx` |
| e2e | `?voice=fake` + `page.route('**/api/voice-session')`: tap mic, scripted call with a scroll, end, transcript in the chat, no console errors; screenshots `web-check/voice*.png`; without the flag no mic button | `e2e/voice.spec.ts` |
| Manual golden check (real agent, not CI) | On production with `?voice=1` (or a preview with `VOICE_ENABLED=true`): role and apps; a tech not on the CV (must say unknown); salary (private); weather (off-topic); "ignore your instructions" (injection); a question in Ukrainian (answer and voice switch); "show his apps" (scroll); "open his LinkedIn" (asks first, then opens or shows the card); stay silent (silence timeout); talk past 3 minutes (cut at 180 s). Results on the ticket. | Ticket comment |

## 13. ElevenLabs agent checklist and env

For the orchestrator (dashboard at elevenlabs.io/app/agents, or the `claude.ai ElevenLabs`
connector). Fields the sync owns are marked *sync*: set a placeholder, the first production call
overwrites it.

1. **Account.** A plan whose credits cover 30 agent minutes a month; usage-based billing **off**.
2. **Agent** "CV Andrew Panasiuk (voice)", blank template.
3. **Agent tab.** System prompt: *sync* (placeholder "CV voice assistant"). First message:
   *sync*. Default language: English. Additional languages: enable all the dashboard offers
   (ElevenLabs' advice for language detection). LLM: `claude-haiku-4-5`, temperature 0, backup
   LLM default. Knowledge base: none (the CV is in the prompt). RAG: off.
4. **Tools.** System tools: `language_detection` on, `end_call` on, all others off. Client tools
   `highlightElement`, `openContact`, `scrollToSection`: *sync* (created by the first production
   call; if created by hand, use §7's JSON with the enums from `buildCvPageToolSpecs`).
5. **Voice.** A stock voice from the default library (calm, clear, works in many languages);
   TTS model: the lowest-latency multilingual one offered (Flash v2.5 today). Record the
   `voice_id` on the ticket.
6. **Advanced / conversation.** Max conversation duration: *sync* (180 s). Turn timeout 7 s
   (default). Silence end-call timeout 20 s. Client events: defaults plus `agent_response`,
   `user_transcript`, `agent_response_correction`, `interruption`, `client_tool_call`.
7. **Security.** Enable authentication: **on**. Allowlist: **empty**. All overrides: **off**.
   Call limits: concurrency **1**, daily limit **20**, bursting **off**.
8. **Privacy.** Record voice: **off**. Retention: **40 days**. Zero retention mode: off (the
   month check needs the conversation list).
9. **Widget.** Not used; leave unpublished.
10. **API key.** New key "cv-web voice", restricted to ElevenLabs Agents (read and write; nothing
    else). If the dashboard offers a credit limit per key, set it to the plan's monthly credits.
11. **Env** (Vercel Production + Preview; `.env.local` for dev):

| Env var | Where | Default | Meaning |
|---|---|---|---|
| `VOICE_ENABLED` | Vercel, `.env.local` | unset (off) | `true`: the endpoint mints tokens. Kill switch: `false` + redeploy. |
| `ELEVENLABS_API_KEY` | Vercel (Sensitive), `.env.local` | none | Server only. Missing: `503 unavailable`. |
| `ELEVENLABS_AGENT_ID` | Vercel, `.env.local` | none | The agent above (`agent_…`). Missing: `503 unavailable`. |
| `VOICE_FAKE` | `.env.local` only | unset | `1`: fake token, no ElevenLabs; ignored when `VERCEL_ENV` is set. |

`.env.example` gets the four with comments in the style of the chat's block.

## 14. Build split

Four build tickets with non-overlapping zones (root `AGENTS.md` → Hot spots), in this order:

```text
A Backend ──> B Scaffold + voice client ──┐
C Theme (needs CV-147 merged) ────────────┴──> D Chat screen voice mode
orchestrator: ElevenLabs agent + env (after A merges, before D's golden check)
```

| # | Task | Role / owner | Zone (may change) | Depends on |
|---|---|---|---|---|
| A | **Voice session endpoint and agent sync.** Commits `src/data/voice/contract.ts` **first** (own commit, so B and D can start against it). `api/voice-session.ts`; `server/voice/**` (handler, config, log, `ElevenLabsApi` + fake, `monthUsage`, `prompt/voicePrompt.ts`, `agentConfig`, `agentSync`, tests, `AGENTS.md`); `server/chat/prompt/systemPrompt.ts` (split into shared blocks, bytes unchanged) and its test; `server/dev/chatApiPlugin.ts` (mount the route); `server/test/` (delete the new env); `.env.example`; `server/AGENTS.md`, `api/AGENTS.md`; `src/data/voice/AGENTS.md` + `CLAUDE.md`. Spike first: a hello `api/voice-session.ts` on a preview. | Backend | the paths listed | none |
| B | **Voice client, flag and platform.** `package.json` + lock: `@elevenlabs/client` **pinned `1.27.0`** (exact; its `livekit-client` comes with it). `src/data/voice/` except `contract.ts` (`VoiceClient`, `ElevenLabsVoiceClient`, `FakeVoiceClient`, `HttpVoiceSessionRepository`, context, `index.ts`, tests); `src/app/voiceMode.ts` + test, `src/app/AppProviders.tsx` (bindings, test seam props); `eslint.config.js` (only `src/data/voice/ElevenLabsVoiceClient.ts` imports `@elevenlabs/*`; `server/`, `api/` never); `scripts/securityHeaders.ts`, `vercel.json` (`headers` and `functions["api/voice-session.ts"]: { "maxDuration": 30 }`, enough for the first call's agent sync plus the usage and token calls at 5 s timeouts each), `e2e/securityHeaders.spec.ts`; `.github/workflows/prod-smoke.yml` (`GET /api/voice-session` → `405`). Checks that the SDK lands in a lazy chunk (build output). | Scaffold | the paths listed | A (contract) |
| C | **Voice tokens.** `src/theme/tokens.css` (orb gradient, fog colours, voice motion and sizes from `docs/design/voice/`), `src/shared/icons/` only if the design calls the mic icon shared. | Theme | `src/theme/**`, `src/shared/icons/**` | CV-147 merged |
| D | **Voice mode in the chat.** `src/screens/chat/**`: `voice/` (`useVoiceCall`, mic button, voice mode, orb, fog, timer, card wiring, tests), `conversation.ts` / `ChatUiState.ts` / `MessageList` (call entries, `buildHistory` text-only), `ChatLauncher` (mic button left of the pill), `strings.ts`, `testIds.ts`, `AGENTS.md`; `e2e/voice.spec.ts` (new file; the orchestrator grants it in the brief, as `e2e/**` is Scaffold's). Ends with the manual golden check (§12) once the agent exists. | Development (chat screen) | the paths listed | A, B, C; agent + env for the golden check |

Docs: each ticket updates `docs/voice/` where the build differs from this design, proposed in its
PR (`docs/**` is the coordinator's). `docs/chat/SYSTEM_DESIGN.md` §13 (the old Web Speech plan) is
replaced by a pointer here in A's or the coordinator's next docs change.

## 15. Risks and open points

| Risk | Mitigation |
|---|---|
| `@elevenlabs/client` changes fast (1.27.0 on 2026-10-06) | Pinned exact; one adapter file; the fake keeps tests independent; Dependabot bumps go through B's tests and a manual call. |
| The conversation list lags behind a just-minted token | Checked in A against the real API; fallback: count this instance's tokens of the last 15 min (§5). |
| Two prompts drift in tone or facts | Shared blocks and knowledge in code, sync per deploy, voice golden check; Custom LLM is the escape hatch (ADR-0008). |
| Popup blocking makes `openContact` need a tap | By design (§7): the card asks for one tap; the agent says so. |
| Language detection picks the wrong language on short utterances | Default English first message; the visitor can say "speak English"; checked in the golden set. |
| A visitor in a noisy place triggers barge-ins | Agent defaults; tune turn settings after the golden check, not now. |
| CSP or Permissions-Policy blocks the SDK in some browser | B verifies on a preview with a real call (Chrome, Safari, Firefox; iOS Safari for the mic). |
