# ADR-0011: The CV card keeps its width and slides left for the column; without room, the chat floats over the page

**Status:** Proposed (CV-198); superseded in part by
[ADR-0012](0012-voice-panel-v3-morph-from-the-pill.md) (CV-202): the full-height column of
Decision 2 and the column's motion in Decision 3 gave way to one floating panel that morphs out
of the launcher pill. Decision 1, the 1584 px breakpoint and the timing tokens stand.
**Date:** 2026-10-09
**Deciders:** Andrew Panasiuk (owner); orchestrator
**Supersedes in part:** [ADR-0010](0010-voice-panel-v2-typing-in-call-animated-dock.md) Decision 2
(the shell animates `main`'s `padding-inline-end`, the page reflows narrower, scroll anchoring by
hand) and, in [ADR-0009](0009-voice-panel-shared-conversation.md) Decision 3, the mechanism
("`side` adds `padding-inline-end`, the CV reflows into the narrower box") and the 1024 px
breakpoint. Still standing: the chat owns its surface and reports a dock, the shell owns the
page's box, home doesn't change, the bottom dock, and ADR-0010 Decision 1.
**Related:** [`docs/voice/SYSTEM_DESIGN.md`](../voice/SYSTEM_DESIGN.md) §4.3 and §14,
`docs/design/voice/` (Layout zones, Motion), ticket CV-198

## Context

Since ADR-0010 an open chat column (text or call) on a screen ≥ 1024 px wide makes the shell pad
`main` by `--chat-dock-width` (416 px), animated, and the CV reflows **narrower**: at 1280 px the
white card goes from 1120 to 816 px and its grids drop a column; at 1024 px it is 560 px.

On 2026-10-09 the human asked for something else (CV-198):

1. **The CV keeps its width.** The white card is not narrowed; it **slides left**, smoothly and not
   fast, leaving a small margin at the left edge, to make room for the column.
2. That works only where the viewport has spare room around the card. **On a narrower (not phone)
   screen the page doesn't move, and the chat shows over it**, as the 600–1023 px band does today.
3. Phones (≤ 599 px wide or ≤ 499 px tall) stay as they are.

The page's geometry (`src/screens/home/HomePage.module.css`, tokens): `main` holds a root with
`padding: var(--page-margin)` (24 px from 1200 px up) around the card, `max-width:
var(--page-max-width)` (1120 px), `margin: 0 auto`. The column is `fixed`, 400 px wide, 16 px from
the right edge, so it takes `--chat-dock-width` = 416 px. Nothing inside `main` is `position: fixed`
or `sticky`; the chat, its launcher, the call pill and the show are siblings of `main`.

## Decision 1: The shell slides `main` by half the dock width with a transform

When the dock is `side`, `src/app/App.module.css` gives `main`
`transform: translateX(calc(var(--chat-dock-width) / -2))` (−208 px) and transitions it. Nothing
reflows: the card keeps its width and moves left as one piece.

Half the dock width puts the card **in the middle of the space left of the column**: the card's
left margin equals its gap to the column. The shift is the same at every width, so the shell needs
no breakpoint and no measuring. At 1600 px: the card 240 → 1360 moves to 32 → 1152; the column
starts at 1184; 32 px on each side of the card.

| Option | Assessment |
|---|---|
| **A. `transform` on `main`, constant −`--chat-dock-width` / 2 (chosen)** | Compositor-only: no layout or paint of the page per frame, so the "slow, smooth" timing costs nothing. The card's box and the document's height don't change, so the scroll position can't drift: `usePageAnchor` (ADR-0010's hand-made anchoring for Safari) is no longer needed and goes. One CSS rule, no JS, home unaware. |
| B. Keep ADR-0010's `padding-inline-end` transition, only above the new breakpoint | At ≥ 1584 px the padded card keeps 1120 px and ends where A puts it. But `main` still lays out every frame, the padding still turns off native scroll anchoring, and the anchor hook stays. Kept as the fallback if A misbehaves. |
| C. Slide the card only as far as needed to clear the column | The shift shrinks as the screen grows (40 px at 1920, none at 2000), and the card ends hugging the column with empty space on the left. Needs viewport math in CSS. Rejected: A looks balanced at every width. |
| D. Slide the card to a fixed small left margin | At 1920 the card would travel 376 px and sit far from the column. Rejected. |
| E. Home moves its own card | Home would have to read the chat's state. Rejected, as in ADR-0009. |

Details:

- **A transformed `main` is a containing block for `position: fixed` descendants** and a stacking
  context while the dock is `side`. Nothing inside `main` is fixed or sticky today; the shell's
  `AGENTS.md` records the rule (an overlay belongs next to `main`, not in it).
- **The background** to the right of the moved `main` is `body`'s `--color-page`, the same colour.
  `main` moves left by 208 px, but its content starts ≥ 24 px from the left edge (Decision 2), so
  nothing is cut off and no horizontal scrollbar appears.
- **The bottom dock** (phone call sheet) keeps its padding and `scroll-padding-bottom`.

## Decision 2: Slide only where the card fits beside the column; otherwise the chat floats over the page

The chat keeps deciding its layout (`ChatLayout`: `column`, `card`, `sheet`) and the dock.
`column` (dock `side`, the slide) needs a viewport at least

```
--page-max-width 1120 + --chat-dock-width 416 + 2 × --space-6 24 = 1584 px wide
```

and ≥ 500 px tall: the full card, the column, and 24 px on each side of the card after the slide.
Below that, down to 600 px wide, the layout is `card`: today's floating card (400 × 600,
bottom-right) or the call panel in its place, over the page, which doesn't move (dock `none`).
Phones keep `sheet`.

- **The number is a literal** in `CHAT_COLUMN_QUERY` (`src/screens/chat/chatDock.ts`) and the
  chat's one CSS media query (`ChatColumn.module.css`): media queries can't read custom
  properties. A unit test next to `chatDock.ts` reads `src/theme/tokens.css` and checks that the
  literal equals the sum of the tokens above, so changing a token without the breakpoint fails
  *test*.
- **The shell has no breakpoint**: the chat reports `side` only at ≥ 1584 px.
- **At the threshold** (a resize across it): the layout flips between the column and the floating
  card in one render, as it flips at 1024 px today; with the dock the page slides back or out with
  the same transition. With a classic 15 px scrollbar the margins at exactly 1584 px are ≈ 16 px.
- **Who gets what:** 1280, 1366, 1440 and 1536 px laptops get the overlay (the floating card, as
  600–1023 px screens do today); 1600, 1680, 1920 px and wider screens get the column and
  the slide.

| Option | Assessment |
|---|---|
| **A. Breakpoint from the tokens, floating card below it (chosen)** | The human's rule, literally: the card never narrows, and the chat only docks where it fits beside the full card. The floating card already exists and is tested. |
| B. A full-height column over the unmoved page between 1024 and 1583 px | Covers the card's right 300+ px from top to bottom. The floating card covers less (600 px tall). Rejected; the human may still pick it (CV-198 comment). |
| C. Keep narrowing the card between 1024 and 1583 px | The human asked for the card to keep its width. Rejected. |

## Decision 3: Motion: one slow, smooth timing for the card and the column

New tokens (values in `docs/design/voice/` → Tokens): `--chat-slide-duration` 500 ms (open),
`--chat-slide-exit-duration` 400 ms (close), `--chat-slide-easing` `cubic-bezier(0.4, 0, 0.2, 1)`
(standard ease-in-out, both ways). `main`'s transform and the column's slide use them, so they
start on the same frame (both sides still use `useLayoutEffect`, ADR-0010) and end together. The
column travels 416 px and the card 208 px on the same curve, so the gap between them only closes
and never goes below its final value. The phone call sheet keeps `--chat-dock-duration` /
`--chat-dock-exit-duration` (300 / 250 ms).

`prefers-reduced-motion: reduce`: no transition; the card moves at once (no reflow, so nothing to
anchor) and the column fades in and out.

**Check before Ready** (the Scaffold ticket): a Chrome performance trace of opening and closing
the column at 1600 × 900 with 4× CPU throttling shows no Layout events on the frames of the
transition and no dropped frames. If it does show them, the fallback is option B of Decision 1.

## Consequences

- **Easier.** The CV reads the same with the chat open: same width, same grids, same line breaks.
  The animation is cheap enough to be slow. The shell loses a hook (`usePageAnchor`) and its
  Safari special case. The dock contract (`ChatDock`, `onDockChange`) doesn't change.
- **Harder.**
  - Most laptops (up to 1536 px) no longer get the docked column: the chat floats over the
    bottom-right of the page there. The agent's scroll puts targets at the top of the viewport, so
    a highlighted section's start stays visible beside the card; its right part may sit under it.
  - The breakpoint is a number derived from three tokens, kept honest by a test.
  - While the column is open, `main` is a containing block for fixed elements (none today).
- **Revisit:** the overlay's shape on 1024–1583 px screens if the floating card feels small there
  (option B of Decision 2); the fallback of Decision 1 if a browser blurs text during the slide.
