# ADR-0013: One panel view for text and call, one collapse control, Call while an answer streams

**Status:** Proposed (CV-208)
**Date:** 2026-10-09
**Deciders:** Andrew Panasiuk (owner); orchestrator
**Supersedes in part:** `docs/design/voice/SPEC.md` Decision 24 (Call is disabled while a text
answer streams) and the swap between two frames (`ChatPanel` ⇄ `VoicePanel`) for `text ⇄ call`.
Still standing: ADR-0009 (one conversation, the dock), ADR-0010 (typing during a call goes to the
agent), ADR-0011 Decision 1 (the slide), ADR-0012 (one floating frame, the morph), the five
surfaces and their names.
**Related:** [`docs/voice/SYSTEM_DESIGN.md`](../voice/SYSTEM_DESIGN.md) §4.1, §4.2, §6, §8, §14;
`docs/design/voice/` (Layouts 2, 4, 8, Icons, States); ticket CV-208

## Context

After the v3 build the human tried the panel and asked (2026-10-09):

1. **One view.** The text chat and the call feel like two windows: the × of the call view (on an
   error card) goes back to the text chat instead of closing, the text chat has a × and the call a
   minimize chevron, and while connecting there is no way out at all. The panel's close control
   should always fold **the whole panel**: back into the launcher, or into the call pill while a
   call is on.
2. **A collapse icon instead of ×**: two arrows pointing at each other, the "minimize window"
   glyph of ElevenLabs' panel (the frames on CV-202).
3. **Call is never disabled while an answer streams.** The question or answer in flight is
   handed to the voice agent when the call starts, so nothing is lost.

In the code today `text` and `callChat` are `ChatPanel`, and `call` is a second frame,
`VoicePanel`, with its own header. The frame crossfades between the two (`FrameExit` `swap`).
Each one has its own way out: × in the text chat (`close`), the chevron during a call
(`minimize`, disabled while connecting), and × on an error card (`leaveCard('back')` → `text`).

## Decision 1: One panel, three views; the call is a mode of it

The panel is **one element**: `ChatPanel` in `ChatFrame`, with one header slot, one middle and one
composer. `text`, `call` and `callChat` are what that element shows, not separate panels:

| Surface | Header | Middle | Composer |
|---|---|---|---|
| `text` | the chat header | the conversation | text mode (Call + field) |
| `call` | the call header (badge, timer, toggle) | the orb stage (`VoiceStage`; cards in it) | call mode (End, Mute, field); none on an error card |
| `callChat` | the call header (mini orb, status · time, toggle) | the conversation | call mode |

`VoicePanel` stops being a frame. Its stage becomes the panel's middle in `call`, and its header
merges with `VoiceCallHeader` into one call header that differs only in the left slot (as the
SPEC already draws it). A swap between views never unmounts or crossfades the frame: only the
header's left slot, the middle and the composer's left slot crossfade (SPEC → Motion), so
`FrameExit` keeps only `morph`. The surface names, `data-surface`, the dock, the morph and the
phone sheets don't change. On the phone the element is still a bottom sheet in `call` and the
full-screen sheet in `text` and `callChat`.

The panel keeps each surface's accessibility semantics: at `card` and on phones, `text` and
`callChat` are a modal dialog (`useDialogBehavior`); `call` is non-modal and named "Voice call with
Andrew's AI"; at `slide` the panel is never modal. The element switches `role`, `aria-modal` and
its name when the surface changes, instead of being swapped for another one.

The **chat toggle** is unchanged: it swaps the middle between the orb and the conversation during
a call (`call ⇄ callChat`) and is not shown in `text`.

| Option | Assessment |
|---|---|
| **A. One element, the call is a mode of its middle and header (chosen)** | The human's "one view" literally. One header anatomy and one slot for the way out. Focus and the draft stay in one composer without a hand-off, and the frame never crossfades into a copy of itself. |
| B. Keep two frames, only unify the header controls | Fixes the × but keeps two windows with a crossfade between them, which is what reads as "another view". Rejected. |
| C. Merge the surfaces into `{ open, view }` | A cleaner model on paper, but it renames the surface, test ids, e2e and every reducer test for the same behaviour. Rejected: the five names already describe what is shown. |

## Decision 2: One collapse control folds the whole panel, in every surface

The right end of **every** panel header holds the same control in the same slot: **collapse**
(`chat_icon_collapse`, a 44 icon button). It replaces the text chat's ×, the call's minimize
chevron and the error card's ×. It dispatches one action, `collapse`, whose result depends only on
the call:

| Where | Collapse goes to |
|---|---|
| `text` | `closed`: the launcher pill (a text answer in flight keeps streaming, as closing does today) |
| `call` / `callChat`, call **live** | `callPill`: the call goes on, the pill unfolds to the same view |
| `call` / `callChat`, call **connecting** | `callPill`, newly allowed: the pill reads "Connecting…" with no time, End cancels the attempt; when the call goes live the pill shows status and time; when the start fails while folded the panel unfolds into `call` with its card (the rule the contact card already follows: the card needs the visitor) |
| `call` with an **error or limit card** | `closed`: there is no call to keep, so the card goes with the panel (the attempt is over; a call that was live is in the chat) |

**Esc** = collapse in every surface (also while connecting and on a card). The card's own buttons
don't change: Type instead, Open chat and Close lead to `text`, and Try again / Call again start a
call. Phone Back is unchanged (`callChat` → `call` → `callPill`; a card → `text`). With the
collapse in every header, nothing in the panel says × any more. The first-visit hint keeps its
small × (it dismisses the hint, not the panel).

The icon follows the reference frame: two arrows on the diagonal from the top-right and
bottom-left corners, pointing at each other (24 viewBox, 2 px round strokes, tinted by `ChatIcon`).
It joins the shared chat icons, because the text chat's header uses it too. The minimize chevron is
deleted. Name: "Collapse chat" ("Collapse chat. The call goes on." during a call), with
`aria-expanded="true"` and `aria-controls` = the panel. One test id, `chat-collapse`, replaces
`chat-close`, `chat-voice-minimize` and `chat-voice-close`.

| Option | Assessment |
|---|---|
| **A. One action, the result depends on the call (chosen)** | One rule for the visitor: the control folds the panel, and a live call always survives it. |
| B. Collapse while connecting stays disabled (as minimize was) | No new pill state, but the one control is dead in the first seconds of every call, exactly when a visitor changes their mind about the window. Rejected. |
| C. Collapse while connecting cancels the attempt | "Collapse" would end a call. Rejected: End is the only control that ends one. |

## Decision 3: Call while an answer streams stops it and hands the question to the agent

Call is enabled whenever voice is available, also while a text answer streams (`busy`). A tap on
Call first **stops** the turn in flight with the chat's existing Stop: the request aborts, a tool
round in flight or a waiting confirmation card counts as declined, and the turn keeps what it
wrote, as `stopped`. Then the call starts exactly as today. One channel still speaks at a time.

The **briefing** (the contextual update a call starts with, §8) hands that turn over. When the
entry just before the call is a text turn without a finished answer (stopped by Call, or by the
visitor, or failed), it is sent as two lines instead of being dropped:

```text
Visitor (typed): What did he build at Transcenda?
Assistant (text, unfinished): At Transcenda Andrew led the mobile apps for three products: SpotOn
```

With nothing written yet, the second line is `Assistant (text, unfinished): …`. Earlier
unfinished turns stay out, as today. The label is a contract constant
(`EARLIER_CONVERSATION_UNFINISHED_LABEL` in `src/data/voice/contract.ts`), so the voice prompt
can quote it. The voice prompt's earlier-conversation rule gets one line: *when the update ends
with an unfinished text answer, the visitor started the call before it was done; at their first
turn answer that question, unless they ask something else.*

Nothing else changes on the wire: `/api/voice-session` stays `v: 1`, and `/api/chat` stays
`v: 4`. The stopped turn is dropped from the text model's history as every stopped turn is, and
the call's lines (where the agent answered it) go with the next question in `voiceCalls`. The
partial answer stays visible in the chat.

| Option | Assessment |
|---|---|
| **A. Stop the answer, hand the question and the partial answer to the agent (chosen)** | The existing Stop, one channel at a time, the briefing on time at `live`. The agent knows what was asked and what was already said, and answers by voice. |
| B. Let the answer finish in the chat; send the briefing when it settles | The full text answer, but the briefing arrives seconds late (the agent may answer without it). The text model's page tools and confirmation cards would run during the call, and a card would hide behind the orb. Rejected. |
| C. Send the handed-over question as the call's first visitor turn (`sendUserMessage`) | The agent answers at once, without waiting for the visitor. But the question shows twice in the chat, and the turn may cut the agent's first message (the platform's behaviour is unrecorded). Kept as the revisit. |

## Consequences

- **Easier.** One panel element: no frame crossfade between views, one header anatomy, one way
  out in one place. The surface reducer loses `close` and `minimize` for one `collapse`. Call
  never waits, and the briefing no longer loses the question the visitor was waiting on.
- **Harder.**
  - `ChatPanel` hosts the stage and the call header: `VoicePanel`'s layout and its tests move into
    it. The panel switches `role`, `aria-modal` and its name by surface, and its tests check each.
  - A new pill state (connecting, no time) and a new unfold rule (a start error while folded).
  - Tapping Call cuts the text answer the visitor may have wanted to read; the partial text stays
    in the chat, and the agent answers the question by voice.
  - The voice prompt changes (`VOICE_PROMPT_VERSION`), so the voice golden check runs again.
- **Revisit:** Decision 3, option C, if the golden check shows visitors waiting in silence for the
  cut-off answer.
