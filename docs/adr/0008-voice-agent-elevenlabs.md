# ADR-0008: Voice conversations through ElevenLabs Agents, inside our chat

**Status:** Proposed (CV-146)
**Date:** 2026-10-07
**Deciders:** Andrew Panasiuk (owner); orchestrator
**Related:** [ADR-0001](0001-ai-cv-chat.md) (stateless functions, no DB/KV, hard money caps),
[ADR-0002](0002-page-agent-tools.md) (typed page tools run by the browser registry),
[ADR-0006](0006-one-page-v3.md) (one English page), [ADR-0007](0007-cv-data-source.md) (one CV
version per deploy), [`docs/voice/SYSTEM_DESIGN.md`](../voice/SYSTEM_DESIGN.md) (the design),
[`docs/voice/API.md`](../voice/API.md) (the session endpoint), project "Voice agent
(ElevenLabs)" → "Decisions by the human (2026-10-07)"

## Context

The human decided the product (2026-10-07): a round mic button left of the "Ask my AI" pill opens
a full-screen voice mode. Everything said is written into the existing chat conversation. The
LLM runs inside an **ElevenLabs agent** ("option B"), its knowledge is the CV, the voice is a
stock one, the agent can use the three page tools (`scrollToSection`, `highlightElement`,
`openContact`), it answers in the visitor's language, a call lasts at most 3 minutes and all calls
together at most 30 minutes a month, and voice is hidden behind a feature flag plus a server kill
switch. Custom LLM ("option C": ElevenLabs calling our Claude backend) is a possible later step.

What exists: the text chat (`/api/chat`, `v: 4`, Claude) with its page tools executed by the
browser registry (`src/agent/`), a catalogue built from the CV JSON (`buildCvPageToolSpecs`), the
knowledge rendered by `renderCvPage`, and guards, limiter and logs in `server/chat/`. Constraints
from ADR-0001 still hold: Vercel Hobby, stateless functions, no database or KV, keys never reach
the browser, a hard money cap outside our code. `docs/chat/SYSTEM_DESIGN.md` §13 planned voice as
browser Web Speech around the text contract. The human chose a hosted voice agent instead.

ElevenLabs facts this ADR relies on (docs and `@elevenlabs/client@1.27.0` types, 2026-10-07):
an agent with `enable_auth` accepts only sessions started with a signed URL (WebSocket) or a
conversation token (WebRTC) that a server mints with the API key (`GET
/v1/convai/conversation/token?agent_id=…` → `{ token, conversation_id }`); client tools are
named functions the agent calls in the browser, with JSON-schema parameters (`enum` supported)
and `expects_response` so the agent waits for the result; the agent has `max_duration_seconds`,
`call_limits` (`agent_concurrency_limit`, `daily_limit`), a `language_detection` system tool and
retention settings; `GET /v1/convai/conversations?agent_id=…&call_start_after_unix=…` lists
conversations with `call_duration_secs` and `status`. Overrides from the client (prompt, first
message, language, voice) are disabled unless switched on per field in the agent's Security tab.
The docs say: "Do not configure signed URLs and allowlists together on the same agent."

## Decision 1: ElevenLabs Agents through `@elevenlabs/client`, inside our own UI

The browser runs the call with the framework-agnostic `@elevenlabs/client` (WebRTC), wrapped in
one data-layer adapter behind our own `VoiceClient` interface. Our chat screen owns the UI (mic
button, full-screen voice mode from `docs/design/voice/`), the transcript and the page tools.

| Option | Assessment |
|---|---|
| **A. `@elevenlabs/client` behind our interface (chosen)** | Our look (CV-147), our chat state gets every line, tools run through our registry with our confirmation, a fake replaces it in tests and e2e. One npm dependency, loaded lazily (it pulls `livekit-client`, ≈1 MB unminified) only when the visitor taps the mic. |
| B. `@elevenlabs/react` (`ConversationProvider`, `useConversation`) | Same engine plus React hooks that want a provider above the app and own the state. Harder to fake and to keep out of the main bundle; our screen pattern (state holder → UI state) already does what the hooks do. Rejected. |
| C. The embeddable ElevenLabs widget (`<elevenlabs-convai>`) | No custom full-screen mode, no transcript in our chat, its own styles and a third-party script (CSP `script-src` would have to allow it). Rejected: it cannot deliver the decided UX. |
| D. Custom LLM (ElevenLabs speech + our Claude backend) | One brain and one prompt, but a new streaming endpoint in the OpenAI chat-completions shape, ElevenLabs calling our function on every turn (latency, auth, cost on both sides). Out of scope now (human decision); the upgrade path if the two prompts drift in practice. |
| E. Browser Web Speech around `/api/chat` (SYSTEM_DESIGN §13) | Free, but no full-duplex turn taking or barge-in, uneven voices and recognition across browsers and languages. Not the decided product. Rejected. |

## Decision 2: A same-origin session endpoint mints the token; the cap is checked there

`POST /api/voice-session` (`api/voice-session.ts` → `server/voice/`) is the only place that talks
to ElevenLabs with the key. It runs the same guards as `/api/chat` (method, `Origin`, content
type, body cap, kill switch, the in-memory per-IP limiter) and then:

1. checks the month's voice minutes (Decision 3) and refuses when one more full call would not fit;
2. mints a WebRTC conversation token and returns it with the call cap (`maxCallSeconds: 180`).

The agent has `enable_auth: true` and **no allowlist** (ElevenLabs says not to combine them; the
`Origin` check and the token are the allowlist's job here). Without our endpoint nobody can start
a call. Contract: [`docs/voice/API.md`](../voice/API.md).

## Decision 3: 30 minutes a month, counted from ElevenLabs' own conversation list

No store of ours can count across serverless instances (ADR-0001: no DB/KV). ElevenLabs already
records every conversation of the agent, so the endpoint asks it: list the agent's conversations
started since 00:00 UTC on the 1st of the month and sum `call_duration_secs`, counting a
conversation that is still `initiated` or `in-progress` as a full 180 s. A new call is allowed
only if **a full call still fits** (`used + 180 ≤ 1,800`), so the total never passes 30 minutes.
Two calls racing for the last slot are stopped by the agent's `agent_concurrency_limit: 1`. If
the list call fails, the endpoint fails closed (`502`, no token).

| Option | Assessment |
|---|---|
| **A. ElevenLabs conversation list per session request (chosen)** | Exact across instances, no new service, the same numbers ElevenLabs bills from. One extra API call (≈100–300 ms) per call start. |
| B. In-memory counter per instance | Resets on a cold start, counts per instance: not a cap. Rejected. |
| C. A store (Edge Config, Blob, KV) | A write per call, and Edge Config allows 100 writes a month on Hobby; KV breaks ADR-0001. Rejected. |
| D. Only ElevenLabs-side limits (plan credits, `daily_limit`) | The plan's credits are the hard money cap (usage-based billing off), but they don't express "30 minutes a month for this agent". Kept as the last layer, not the cap. |

Per call: the agent's `max_duration_seconds: 180` ends the call on ElevenLabs' side; a client
timer shows the time left and ends the session at 180 s too.

## Decision 4: The agent's prompt and tools are built from the code and synced by the production function

The voice prompt and the client-tool definitions are not typed into the ElevenLabs dashboard.
`server/voice/` builds them from the same sources as the text chat:

- the **shared rule blocks** (knowledge, scope, safety) move out of `INSTRUCTIONS` in
  `server/chat/prompt/systemPrompt.ts` into exported constants; the text prompt keeps its bytes,
  the voice prompt adds voice style and voice tool rules;
- the **knowledge** is `renderCvPage` over `cvPageData.ts`, in the same `<knowledge>` block, inside
  the prompt (≈1,000 tokens; no knowledge-base document to create, attach and clean up);
- the **tools** are `buildCvPageToolSpecs(page)` mapped to ElevenLabs client tools (same names,
  descriptions and enums).

On Vercel **production** only, the endpoint makes sure the agent matches, once per instance before
it mints the first token: it reads the agent and its three tools, compares them with the built
config and patches what differs. A deploy (or a rollback) therefore brings the agent to the
deployment's CV and prompt with the first voice call, the same "one version per deploy" rule as
ADR-0007. Preview and dev never write the agent.

| Option | Assessment |
|---|---|
| **A. Sync from the production function, lazily (chosen)** | Follows deploys and rollbacks by itself, no CI job or GitHub secret talks to ElevenLabs (tests and CI stay offline), idempotent. Costs: the function's key needs write access to ElevenLabs Agents (scope it to Agents only); the first call per instance waits ≈0.5 s more. |
| B. A CI step after `Deploy production` | Explicit, but CI then talks to ElevenLabs (the brief forbids it for tests and CI), a rollback leaves the agent on the newer CV, an ElevenLabs outage turns `main` red. Rejected. |
| C. Prompt and knowledge as client overrides at session start | Overrides come from the browser: enabling them lets any visitor replace the prompt and use our minutes as a free voice LLM. Rejected. |
| D. Manual dashboard edits | Drift guaranteed: every CV edit and prompt change needs a human. Rejected. |
| E. Knowledge as a KB document uploaded per deploy | Create, attach, delete the old one, RAG settings, for 1,000 tokens that fit in the prompt. Revisit when knowledge grows (SYSTEM_DESIGN §5 thresholds). |

## Decision 5: Same tools, same registry; the transcript joins the chat, the text model doesn't see it

The agent's client tools are executed by the existing browser registry through the chat's
executor, exactly as the text chat's tool calls: same validation, same results
(`not_available`, `unknown_target`, `invalid_params`, `declined`, `failed`), same chips. The
agent must ask out loud before `openContact`; the spoken yes is the confirmation. A new tab opens
only after a tap in every browser, so when the browser blocks the open, the voice mode shows the
confirmation card for one tap.

Every final visitor and agent line becomes part of the chat conversation as a **voice call**
entry. The text chat's request history (`buildHistory`) keeps sending text turns only: `v: 4`
does not change and a call cannot use up the text chat's 10 questions. Continuity between modes
(the text history into a call, a call summary into the text chat) is a later, additive step.

## Consequences

- **Easier.** Speech, turn taking, barge-in and language switching are bought, not built. The
  page tools, their safety rules and their tests are reused unchanged. The month's cap is exact
  without a store. CV edits reach the voice agent with the deploy, like the text chat.
- **Harder.** Two prompts for one assistant: text on Claude via `/api/chat`, voice on the
  ElevenLabs agent's LLM. They stay consistent through the shared rule blocks and knowledge in
  code (a test pins that both contain them) and a voice golden check before release, but the
  models differ, so answers can differ in tone and detail. A new vendor, a new key with write
  access to the agent, a ≈1 MB lazy chunk, CSP `connect-src` entries for ElevenLabs and
  `microphone=(self)` in Permissions-Policy. ElevenLabs keeps the call's transcript (retention
  set to 40 days, no audio recording): the chat's "nothing is stored" promise no longer holds
  for voice.
- **Revisit:** Custom LLM (option D) if the two prompts drift in practice or one brain matters
  more than latency; a KB document if the knowledge outgrows the prompt; sending the voice turns
  to the text model if visitors switch modes mid-topic.
