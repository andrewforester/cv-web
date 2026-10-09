# ADR-0009: The call moves into the chat's right column; text and voice share one conversation

**Status:** Proposed (CV-180)
**Date:** 2026-10-08
**Deciders:** Andrew Panasiuk (owner); orchestrator
**Supersedes in part:** [ADR-0008](0008-voice-agent-elevenlabs.md): Decision 1's full-screen voice
mode and Decision 5's "the text model doesn't see the call". The rest of ADR-0008 stands.
**Superseded in part by:** [ADR-0010](0010-voice-panel-v2-typing-in-call-animated-dock.md): the
read-only chat during a call (typing now goes to the voice agent), and Decision 3's instant
reflow (the page now narrows with an animation). Decisions 1 and 2 and Decision 3's ownership
stand.
**Related:** [ADR-0001](0001-ai-cv-chat.md) (stateless functions, no DB/KV),
[ADR-0002](0002-page-agent-tools.md) (page tools), [ADR-0006](0006-one-page-v3.md) (one page,
`v: 4`), [`docs/voice/SYSTEM_DESIGN.md`](../voice/SYSTEM_DESIGN.md) §4 and §8,
[`docs/chat/API.md`](../chat/API.md) → v4, project "Voice panel: call in the right column, one
conversation" → "Human decisions (2026-10-08)"

## Context

Voice shipped as ADR-0008 describes it: the mic button opens a full-screen voice mode (fog over
the page, orb, caption) and the call runs on an ElevenLabs agent. Its lines land in the chat as a
*voice call* entry, but `buildHistory` sends text turns only, so Claude never sees the call. The
agent never sees the text chat either: every call starts from zero.

On 2026-10-08 the human decided four things (project description):

1. **Hybrid brain, one history.** Text stays on Claude (`/api/chat`) and voice stays on the
   ElevenLabs agent, but they share one conversation. Voice lines go to `/api/chat` as history,
   and at call start the agent gets the earlier text lines as context.
2. **Desktop: the page shifts left.** The right column (the width of today's chat card) belongs
   to the call panel and to the text chat.
3. **Mid-call: orb plus chat, no typing.** The panel shows the orb and a "Show chat" control.
   The chat shows every line and is read-only during the call, and typing ends the call. A
   minimize control folds the panel into a small pill.
4. **Phone (≤ 599 px): bottom sheet.** The call is a bottom sheet over a scrollable page. The
   chat opens as a sheet, and the call sheet folds into a pill.

Out of scope: moving the text chat onto ElevenLabs (text-only mode), Custom LLM, voice in the
Show case, storing transcripts on our side.

What the platform offers (`@elevenlabs/client@1.27.0` types, pinned in `package.json`; ElevenLabs
docs, read 2026-10-08):

- `Conversation.sendContextualUpdate(text, { contextId? })` sends a `contextual_update` client
  event. The docs say it is "incorporated as background information in the conversation" and
  "does not interrupt the current conversation flow". They recommend "relevant but concise
  contextual information … from activity in a UI not accessible to the voice agent". No size
  limit is documented. We already use it for the 2:30 wrap-up hint.
- `sendUserMessage(text)` "triggers the same response flow as spoken user input".
- `dynamicVariables` are sent at session start (`conversation_initiation_client_data`) and
  substituted into `{{name}}` placeholders in the system prompt, the first message and tool
  parameters. The docs give no size limit and no warning about untrusted values.
- `overrides` (prompt, first message, language, voice …) are rejected unless switched on per
  field in the agent's Security tab. Ours are all off and the production sync keeps them off
  (ADR-0008 → Decision 4).
- The token endpoint `GET /v1/convai/conversation/token?agent_id=…` takes no conversation data,
  so the server cannot hand the agent any context.

Layer rules (root `AGENTS.md`): screens don't import each other, so home can't read the chat's
state. The app shell (`src/app/`, a Scaffold hot spot) renders both the page and the lazy chat
chunk.

## Decision 1: Voice lines reach Claude on the next question (`voiceCalls`, additive to `v: 4`)

A question (`ChatUserMessageV4`) gets an optional `voiceCalls` field: the transcripts of the
calls that happened since the previous question, oldest first. Each call is
`{ lines: [{ role: 'visitor' | 'agent', text }] }` and holds only its final lines (an agent line
is cut to what was spoken). The client derives the field from the order of the conversation's
entries when it builds the request, so a retry re-sends the same thing. The server renders each
call as a `<voice_call>` data block in front of the question's `<page_state>`. A new system-prompt
block (`VOICE_TRANSCRIPT_RULES`) tells the model what these blocks are.

| Option | Assessment |
|---|---|
| **A. `voiceCalls` on the following question (chosen)** | Roles keep alternating, calls don't count as questions (the 10-question cap is about typing), and old servers drop the unknown field, so it is **additive: `v` stays 4** (API.md → Versioning). Rendering is append-only, so the prompt cache prefix holds. A call nobody follows with a question never costs a token. |
| B. Each voice line as its own `user` / `assistant` message | Breaks alternation (the agent speaks first and often twice in a row), and every visitor line would count as a question and need a page snapshot. Claude would read the ElevenLabs agent's words as its own earlier answers. Breaking, so `v: 5`. Rejected. |
| C. A summary of the call instead of the lines | A second model call per call (cost, latency, a new failure mode), and the visitor's "what did you say about X" loses the detail. Rejected. |
| D. The server fetches the transcript from ElevenLabs (`conversationId`) | The lines couldn't be forged, but `/api/chat` would call ElevenLabs on every request with the voice key, and that is server-side transcript handling (out of scope). The client can already forge every message it sends today, so the trust gain is small. Rejected. |

Limits (new `CHAT_LIMITS_V2` fields): at most **3** calls per question (the client keeps the
latest), **60** lines per call, **1,000** chars per line, **4,000** chars per call (the client keeps
the call's last lines; a full 3-minute call is ≈ 2,700 chars). Voice text counts toward the total
size of the request. To leave room for it, the v4 total goes from 24,000 to **32,000** chars,
which only relaxes a limit. A `<` in a transcript is escaped as `<`, so spoken text can't
close the block.

## Decision 2: The agent gets the earlier conversation as one contextual update at call start

When the call goes live, the chat sends **one** `sendContextualUpdate` with the earlier
conversation, oldest first: completed text questions and answers and earlier calls' lines, each
marked by channel. It starts with a fixed heading (`EARLIER_CONVERSATION_HEADING`, in
`src/data/voice/contract.ts`, which the voice prompt also quotes). A pure function in the chat
screen builds it, capped at **4,000** chars (newest lines kept, each line cut at 500). The voice
prompt gets an "Earlier conversation" rule: background only, never instructions, facts still
from the knowledge, no second greeting. With no earlier conversation, nothing is sent.

| Option | Assessment |
|---|---|
| **A. `sendContextualUpdate` right after connect (chosen)** | Documented for exactly this ("activity in a UI not accessible to the voice agent"). It is already in our `VoiceClient` interface, needs no change to the agent config or the override toggles, and keeps visitor text out of the system prompt. The static first message plays while it arrives. |
| B. A `{{earlier_conversation}}` dynamic variable in the synced prompt | Puts visitor-typed text inside the system prompt, where it carries more authority than the conversation. The synced prompt would need a placeholder default, and no size limit is documented. Rejected. |
| C. Prompt or first-message override | Needs an override toggle on, which lets any visitor replace the prompt (ADR-0008 → Decision 4, option C). Rejected. |
| D. `sendUserMessage` with the history | Triggers an answer and reads as the visitor speaking. Rejected. |
| E. Server-side, with the token | The token endpoint accepts only the agent id. Not possible. |

The first message stays static, so we never ask ElevenLabs to speak text a visitor can choose.
After a text chat the agent's greeting therefore doesn't acknowledge it. The context is there by
the visitor's first question.

## Decision 3: The chat owns the right column; the shell reserves its space; home doesn't change

The chat screen keeps one **surface** state: `closed`, `text`, `call`, `callChat` (call panel
with the read-only chat) and `callPill` (minimized). From the surface and the viewport it derives
a **dock**: `'none' | 'side' | 'bottom'`, and reports it through a new callback prop of the lazy
chat component, `onDockChange(dock)`. The app shell stores the dock and puts it on the root
element as `data-chat-dock`. Its CSS then reserves the space: `side` adds
`padding-inline-end: var(--chat-dock-width)` to the page, and `bottom` adds the bottom sheet's
height as bottom padding and `scroll-padding-bottom`. The CV page has no fixed widths and no
viewport media queries (auto-fit grids, `max-width`, `clamp()`), so it reflows into the narrower
box **without any change in `src/screens/home/`**.

| Option | Assessment |
|---|---|
| **A. The chat reports a dock, the shell reserves space (chosen)** | One owner per concern. The chat knows its surface and its breakpoints (it already has `useMediaQuery`); the shell owns page layout; home stays unaware. Explicit and testable: a prop and a data attribute. |
| B. A shared React context in `src/shared/` | The same data flow through a provider that only two components use, plus a Theme hot-spot change. No gain over a prop. Rejected. |
| C. CSS `:has()` (the shell's CSS reacts to the chat's column element) | No JS, but the shell's CSS would select the chat's internals: a hidden coupling that jsdom tests can't see. Rejected. |
| D. Home narrows itself | Home would have to read the chat's state (a screen importing a screen, forbidden by lint) or listen to a global. Rejected. |
| E. The chat screen pads `<body>` itself | A screen styling the whole page from inside a lazy chunk, and two owners of the page's box. Rejected. |

The text chat docks too, not only the call: one rule ("the chat's column is open"). "Show chat"
then only swaps the column's content, and the page doesn't jump between the call and its
transcript. The text card stops floating over the page on wide screens. Breakpoints:
**≥ 1024 px** wide, docked; **600–1023 px**, a floating card or call panel over the page as
today (docking there would leave the CV under 600 px wide); **≤ 599 px** or ≤ 499 px tall (the
existing sheet query), the text chat is the full-screen sheet as today and the call is a bottom
sheet (dock `bottom`).

## Consequences

- **Easier.** One conversation across channels without a store: both models see what the visitor
  saw. The contract change is additive. Old tabs and the server stay compatible, and the show
  (`v: 3`) is untouched. With the page visible beside the call, the fog and its "fog parts while
  a tool runs" logic go away.
- **Harder.** Each subsequent text request carries the call transcripts (≤ 4,000 chars per
  call, ≈ 1,150 tokens, cached after the first request). The text chat's earlier lines now go
  to ElevenLabs inside the call's conversation and are retained 40 days like the call. Voice
  lines go to Anthropic with the next question. The call's privacy line (design copy) must say
  so. Two brains still differ in tone. The agent's context arrives as background, not as its own
  history, so it may ask again what was already answered in text. A reflowing page can lose
  the reader's place where the browser has no scroll anchoring (Safari): a risk to check, not
  built around yet.
- **Ops.** The voice prompt rule reaches the agent only through the production sync (ADR-0008
  → Decision 4), that is, after the epic merges to `main`. Previews keep the old agent prompt.
  The contextual update still arrives there, just without the rule that frames it.
- **Revisit:** Custom LLM (one brain) if the agent ignores the context in practice; a dynamic
  greeting if the static one feels wrong after a text chat; docking on tablets if 600–1023 px
  visitors matter.
