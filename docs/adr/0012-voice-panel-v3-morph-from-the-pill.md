# ADR-0012: The chat panel morphs out of the launcher pill and floats, not full height

**Status:** Proposed (CV-202)
**Date:** 2026-10-09
**Deciders:** Andrew Panasiuk (owner); orchestrator
**Supersedes in part:** [ADR-0011](0011-voice-panel-v3-card-slides-or-chat-overlays.md)
Decision 2 (the full-height docked column from 1584 px) and, in its Decision 3, the column's
motion (it slid in from the right edge). Still standing: ADR-0011 Decision 1 (at ≥ 1584 px the
shell slides `main` left by half the dock width with a transform), the 1584 px breakpoint and its
test, the slide's timing tokens, the dock contract (`none | side | bottom`), the phone sheets.
**Related:** [`docs/voice/SYSTEM_DESIGN.md`](../voice/SYSTEM_DESIGN.md) §4.3 and §14,
`docs/design/voice/` (Layout zones, Motion), ticket CV-202

## Context

After CV-198's docs merged, the human sent a screen recording of ElevenLabs' careers page: the
"Voice chat" pill **grows into a floating, rounded chat panel** (a container transform: the pill's
corner stays put, the panel grows out of it, the content fades in), the panel is **not full
height** and floats over the page, and closing shrinks it back into the pill. The human wants our
chat to open like this, and answered (2026-10-09):

1. **≥ 1584 px keeps the slide**: the CV card still slides 208 px left at its own width, and the
   panel grows from the pill into the freed space on the right. Below 1584 px (down to 600) the
   page doesn't move and the same panel floats over it. Phones unchanged.
2. **The launcher stays bottom-right**, so the panel grows up and to the left from it.
3. **Not full height**: ADR-0011's full-height column goes; the panel is the floating card at
   every width above the phone, never edge to edge.

Only the motion and the shape come from the reference; the look stays ours (the chat's dark card).

## Decision 1: One floating panel above the phone; the page still slides from 1584 px

Every width ≥ 600 px (and ≥ 500 px tall) shows the chat, the call and the chat during a call in
one floating frame: `fixed`, `right/bottom: --space-4`, 400 × `min(--chat-panel-height, 100dvh −
32)`, which is today's overlay card. There is no column any more.

The **dock contract doesn't change**: from 1584 px the chat still reports `side` while it is open,
and the shell still slides `main` by −208 px (ADR-0011 Decision 1). The panel's left edge is where
the column's was (`--chat-dock-width` from the right), so the breakpoint's sum and its test stand.
Below 1584 px the dock is `none` and the panel floats over the unmoved page.

`ChatColumn` is merged into the floating frame: one placement for every non-phone width
(`ChatColumn.module.css` becomes `ChatFrame.module.css`), and the layout name `column` becomes
`slide` (`ChatLayout = 'slide' | 'card' | 'sheet'`, `CHAT_SLIDE_QUERY`): the two wide layouts
differ only in whether the page slides and whether the text chat is modal (at `slide` the page
moved aside to stay usable, so the chat stays a non-modal region; at `card` it covers the page and
stays today's dialog).

| Option | Assessment |
|---|---|
| **A. One floating frame everywhere ≥ 600, the overlay's size (chosen)** | The human's "not full height" and "the same panel" literally. One placement, one size, one motion; the call stage was already checked at 600 px (`docs/design/voice/` → Layout 2). |
| B. Taller on wide screens (e.g. `min(720, 100dvh − 32)` from 1584 px) | More room for the chat on big monitors, but a second size to keep and test, and the brief allows it only as a refinement. Kept as a revisit. |
| C. Keep the full-height column at ≥ 1584 px, morph only below | Two shapes for one panel; the human asked for the floating card everywhere above the phone. Rejected. |

## Decision 2: The morph is a clip-path reveal of the final-size panel, from the pill's own box

Opening grows the panel out of the pill; closing and minimizing shrink it back into the pill that
takes its place. The panel is laid out at its final size from the first frame, anchored
bottom-right (where the pill is), and only its **`clip-path: inset(… round …)`** animates: from
the pill's box (its width and height, radius half its height) to the whole panel. The content
fades in on top of the growing dark shape; the shadow follows once it lands. The pill (the launcher, or the call pill on minimize
and expand) sits **above** the panel and fades, so the white pill turns into the dark card instead
of vanishing under it.

The pill's box is **measured**, not a token: the launcher's width follows its label and the call
pill's its status and time. The leaving and the entering element are mounted in the same commit
(`usePresence` keeps the leaving one), so a layout effect reads the mounted pill's
`getBoundingClientRect()` once per surface change and writes `--chat-morph-w` / `--chat-morph-h` on
the chat root; the frames read them with a 48 px fallback (`--space-9`, a circle in the corner).

| Option | Assessment |
|---|---|
| **A. `clip-path` on the final-size panel (chosen)** | No layout per frame: the content never reflows, the page is untouched; the clip is paint-only (composited where the browser supports it). The clip stays inside the panel (`inset(0 round --radius-card)` at the end), so every corner of the growing shape is round: 24 px from pill to card. The clip also hides the panel's shadow, so the shadow fades in (150 ms, paint-only) when the panel lands; on a close it goes with the first frame, under the content's fade. |
| B. Animate the frame's `width` / `height` with fixed-size content inside | The shadow follows for free, but every frame lays out the frame, and the panels need a new inner wrapper. Rejected: the slide was made compositor-only for the same "smooth, not fast" reason. |
| C. `transform: scale()` from the pill (FLIP) | Cheapest, but a 172 × 48 → 400 × 600 non-uniform scale distorts the corners and the text unless every child is counter-scaled. Rejected. |
| D. View Transitions API | Snapshots stretch the white pill into the dark card and interfere with `main`'s own transition; needs `flushSync` around React updates. Rejected for now. |

## Decision 3: One timing for the morph and the slide, at every width

The morph uses the slide's tokens (ADR-0011 Decision 3), with no new ones: open
`--chat-slide-duration` 500 ms, close and minimize `--chat-slide-exit-duration` 400 ms, both
`--chat-slide-easing`. At ≥ 1584 px the page slides on the same frames, so the panel lands as the
card stops. The content fades in from 150 to 350 ms (`--chat-motion-exit-duration` delay,
`--chat-motion-duration`) and fades out in the first 150 ms of a close; the shadow fades in from
500 to 650 ms. The pill fades out in
150 ms on open, and fades back in over the last 200 ms of a close, so it is whole when the panel is
gone.

The call fits the same frame: `text ⇄ call ⇄ callChat` stay crossfades inside it (the frame
neither moves nor resizes). **Minimize** shrinks the panel into the call pill and **expand** grows
it out of the call pill, exactly like close and open with the launcher; on wide screens the page
slides back and out with them. A tap on the ended pill opens the chat out of that pill.

`prefers-reduced-motion: reduce`: no clip, no slide; the panel and the pills crossfade (opacity,
150 ms) and the page moves at once. Phones keep their sheets and their motion.

## Consequences

- **Easier.** One placement and one size for the chat above the phone: the 1584 px resize no
  longer swaps frames (only the dock flips and the page slides). The opening reads as one object
  (the pill becomes the panel), the human's reference. No new tokens; the dock contract, the shell
  and the slide (task S) don't change.
- **Harder.**
  - The chat measures one element per surface change (the pill's box) to start the morph.
  - On wide screens the panel covers the bottom 600 px of the freed strip; the strip above it is
    empty page. The slide still keeps the whole card visible beside the panel.
  - `clip-path` keyframes on mount and unmount: a quick open → close starts the close from the
    full panel instead of reversing mid-way (as the column's keyframes did); the page's slide
    still reverses smoothly.
- **Revisit:** a taller panel on wide screens (Decision 1, option B) after the human's check on
  a 1600+ px screen; option B of Decision 2 if the shadow's late arrival reads as a pop on a real
  screen, or a browser stutters on the clip.
