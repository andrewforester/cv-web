# ADR-0010: Typing during a call goes to the voice agent; the page narrows with an animation

**Status:** Proposed (CV-189)
**Date:** 2026-10-09
**Deciders:** Andrew Panasiuk (owner); orchestrator
**Supersedes in part:** [ADR-0009](0009-voice-panel-shared-conversation.md): the human decision
"the chat is read-only during a call; typing ends the call" (Context, item 3) and, in Decision 3,
the page reflowing at once. The rest of ADR-0009 stands: one conversation, `voiceCalls`, the
contextual update at call start, the chat reports a dock and the shell reserves the space.
**Related:** [ADR-0008](0008-voice-agent-elevenlabs.md) (the agent, its prompt sync),
[`docs/voice/SYSTEM_DESIGN.md`](../voice/SYSTEM_DESIGN.md) §4 and §8,
[`docs/chat/API.md`](../chat/API.md) → Voice calls in the history, `docs/design/voice/`,
ticket CV-189 (with CV-190, the design)

## Context

The call panel shipped as ADR-0009 describes it (CV-182 … CV-188 on `feature/voice-panel`). On
2026-10-09 the human reworked the UX. These decisions are final:

1. **One launcher.** The mic button next to the pill goes. One pill, "Talk to my AI", opens the
   chat (the column on wide screens).
2. **The call button is inside the chat**, clearly visible, with a phone-handset icon. The
   composer's placeholder reads "…or type instead" (exact copy: `docs/design/voice/`).
3. **Typing during a call goes to the voice agent**, not to `/api/chat`. The visitor can type
   mid-call. The ElevenLabs agent gets the text and answers by voice, and the typed line shows in
   the chat as a visitor line of the call. After the call, typed messages go to Claude with the
   whole history, the call included (`voiceCalls`). Switching between voice and text is seamless.
4. **Show chat / Hide chat in one place.**
5. **Animation.** Opening and closing the column is animated, and so is the page narrowing beside
   it. Today the page reflows at once (design Decision 14).

Items 1, 2 and 4 are layout and copy (`docs/design/voice/`, `SYSTEM_DESIGN.md` §4). Items 3 and 5
need decisions, below.

What the platform offers (`@elevenlabs/client@1.27.0`, pinned; `dist/BaseConversation.d.ts` and
`.js`; ElevenLabs docs "Client to server events", read 2026-10-09):

- `sendUserMessage(text)` sends a `user_message` event. The docs say it sends "text directly to
  the conversation as if the user had spoken it" and "triggers the same response flow as spoken
  user input". The docs don't say whether it interrupts the agent's current speech, or whether
  the server echoes it back as a `user_transcript`. The SDK doesn't call `onMessage` for it
  locally.
- `sendUserActivity()` sends `user_activity`, throttled by the SDK to once per second. The docs
  say it "resets the turn timeout timer" and serves "to prevent interrupts from the agent". They
  don't say whether it also holds off the silence end-call timeout (ours is 20 s).
- `sendContextualUpdate(text)` adds background and gets no answer (ADR-0009 → Decision 2).
- `sendMultimodalMessage({ text })` wraps the same `user_message` for file uploads.

Page layout today: `src/app/App.tsx` stores the chat's reported dock and writes `data-chat-dock`
on `<html>` from a `useEffect`. `App.module.css` sets `main`'s `padding-inline-end` from it, with
no transition. The chat reports from a `useEffect` too, so the page reflows one or two frames
after the column mounts. The CV page has no fixed widths and no viewport media queries.

## Decision 1: While a call is live, the composer sends to the agent (`sendUserMessage`)

`VoiceCall` gets two methods, mapped in `ElevenLabsVoiceClient`:

- `sendText(text)` calls `sendUserMessage(text)`.
- `typing()` calls `sendUserActivity()`.

The chat routes Send by the call's state at the moment of sending:

- **Call `live`:** the text goes to `sendText`. The chat appends it right away as a visitor line
  of the call, with a client id `typed-<n>`. The agent's spoken answer arrives as an ordinary
  agent line.
- **Call connecting:** Send is disabled, and the field stays editable.
- **Any other state:** `/api/chat`, as before. A call that ends while the visitor is typing
  leaves the text in the field, and the next Send goes to Claude with the call in `voiceCalls`.

| Option | Assessment |
|---|---|
| **A. `sendUserMessage`, the client records the typed line (chosen)** | Documented for this ("as if the user had spoken it"), one adapter method, no agent setting or override. The agent answers in its own voice and context, so the call stays one conversation. The client already knows the exact text, so the transcript doesn't depend on an echo the docs don't promise. |
| B. Typing ends the call (ADR-0009) | Reversed by the human. |
| C. Typed text goes to `/api/chat` during the call | Two brains answer at once: Claude in text, the agent unaware until the next call. Not "seamless". Rejected. |
| D. `sendContextualUpdate` with the typed text | Background only, so the agent doesn't answer. Rejected. |
| E. `sendMultimodalMessage({ text })` | The same `user_message` inside a wrapper meant for files. No gain. Rejected. |

Details:

- **Echo.** If the platform echoes a typed message as a `user_transcript`, the line would appear
  twice. The adapter therefore keeps the typed texts it sent in the last 10 s and drops a visitor
  `user_transcript` that exactly matches the oldest of them (trimmed). This works whether or not
  an echo comes, and the build ticket records which one happens on a real call.
- **Keeping the agent from talking over the visitor.** The composer calls `typing()` on input
  while a call is live. The SDK throttles it to once per second. Whether this also holds off the
  20 s silence end-call is checked in the golden check. If a slow typist gets hung up on, the
  checklist's silence timeout goes up (`SYSTEM_DESIGN.md` §13).
- **Interruption.** The client doesn't cut the agent's speech when a typed line is sent; the
  platform handles the line as a user turn. The golden check records whether it interrupts.
- **Mute** affects only the microphone. Typing works muted ("type instead" in a quiet room).
- **Limits.** A typed line is capped at the composer's `maxUserMessageChars` (1,000), which equals
  `maxVoiceLineChars`. Typed call lines are call lines: they never count toward the 10 questions,
  and the call's 3 minutes and the month's 30 bound them. They count toward the call's
  4,000-char transcript cap (the client keeps the last lines, as for speech).
- **Wire.** `/api/chat` doesn't change: a typed call line travels as a `visitor` line in
  `voiceCalls`, and `v` stays 4.
- **Trust.** Typed text to the agent is visitor input, exactly like speech: same prompt rules,
  same enum-only tools, and `openContact` still waits for the visitor's yes (spoken or typed).
  Typing makes a long, precise injection easier than speaking one. It is capped at 1,000 chars,
  the same as a question to Claude, and can do no more than a spoken one (scroll, highlight, ask
  to open a contact). The voice prompt gets one rule: typed turns are ordinary visitor turns,
  answered aloud in the same style, without reading out pasted links, code or long text
  (`VOICE_PROMPT_VERSION` moves).
- **Privacy.** A line typed during a call goes to ElevenLabs inside the call's conversation
  (retained 40 days), then to Anthropic with the next question. The call's privacy line ("Voice
  and text share one history") already covers it.

## Decision 2: The shell animates the reserved width; the chat animates the column, on the same frame

The shell keeps ownership of the page's box (ADR-0009 → Decision 3). `App.module.css` gives
`main` a transition on `padding-inline-end`:

- **Opening:** `--chat-motion-duration`. The transition sits on the `data-chat-dock='side'` rule,
  so it applies on the way in.
- **Closing:** `--chat-motion-exit-duration`, on the base rule.
- **Easing:** `--chat-motion-easing`. If the design package adds dock-specific tokens, the shell
  uses those instead.
- **`prefers-reduced-motion: reduce`:** no transition (instant reflow), and the column is
  opacity-only.
- **Other docks:** the bottom dock (phone sheet) and the floating card (600–1023 px) don't
  animate the page.

The chat's column animates its own entry and exit with the same tokens. The two start on the same
frame:

- The chat reports the dock from a `useLayoutEffect`.
- The shell writes `data-chat-dock` from a `useLayoutEffect`. A state update inside a layout
  effect renders again before paint.
- The dock follows the **surface**, not the column's presence. On close or minimize, the page
  widens while the column leaves, not after it.

| Option | Assessment |
|---|---|
| **A. CSS transition on the shell's padding (chosen)** | One owner per concern, as in ADR-0009: home stays unaware and the chat doesn't touch the page. A few lines of CSS plus a token, and reduced motion is a media query. The cost is layout per frame for ≤ 200 ms, on wide screens only. It is measured before Ready, with a one-rule fallback (below). |
| B. Reflow at once, animate only the column (ADR-0009, design Decision 14) | Cheapest, but reversed by the human. Kept as the fallback. |
| C. View Transitions API (`document.startViewTransition`) | No per-frame layout, but the old and new snapshots of a text page stretch while they morph unless they are cropped by hand. The page is inert during the transition. The chat's state update would have to run inside the shell's `startViewTransition` with `flushSync`, so the chat would drive the shell's transition. Rejected; revisit if A janks. |
| D. `transform: scaleX` on `main` | Squeezes the text. Rejected. |
| E. Home animates its own width | Home would need the chat's state (a screen importing a screen). Rejected, as in ADR-0009. |

**Scroll anchoring.** Chromium and Firefox keep the reader's place on every layout of the
transition (CSS scroll anchoring). Where `CSS.supports('overflow-anchor', 'auto')` is false
(Safari), a shell hook does it by hand:

1. On a dock change, take the element at a point just below the top of `main`'s visible box
   (`document.elementFromPoint`, plain DOM; no knowledge of home), and note its top.
2. On each animation frame until `transitionend` or `transitioncancel` on `main` (at most the
   duration + 50 ms), scroll by the drift.
3. Wheel, touch or a key cancels the run. Under reduced motion it runs once, after the reflow.

**Performance budget.** The Scaffold ticket records a Chrome performance trace of opening and
closing the column at 1280 × 800 with 4× CPU throttling. If frames during the transition take
longer than 16 ms, the transition rule is removed and the page goes back to reflowing at once
(option B), with the trace on the ticket. The page can't be made cheaper from the shell without
touching home.

## Consequences

- **Easier.** Voice and text feel like one conversation: the visitor types or speaks into the
  same call, and Claude takes over when it ends, with the whole history. One launcher. The wire
  contract and the server's chat pipeline don't change.
- **Harder.**
  - The call is no longer "speech only". The transcript mixes spoken and typed visitor lines, and
    the screen model doesn't distinguish them (the wire doesn't either).
  - The agent behaves in ways the docs leave open (echo, interruption, silence timeout with
    typing). The adapter and the golden check pin them.
  - The composer serves two destinations, so the send path branches on the call state in one
    place (the chat's state holder).
  - Each docking costs about 12 frames of page layout on wide screens.
- **Ops.** The voice prompt's typed-turn rule reaches the agent only through the production sync
  (ADR-0008 → Decision 4). Previews answer typed turns with the old prompt, which still treats
  them as visitor turns.
- **Revisit:** View Transitions (C) if the padding transition janks on real devices; marking
  typed lines on the wire if Claude misreads them as speech-to-text.
