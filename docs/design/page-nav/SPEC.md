# Page nav: a section toolbar on the CV page

Approved by the human on 2026-10-16 as variant **T1**, out of two top-toolbar variants (T2, a dark
toolbar with the name and an "Email me" button, was rejected; the earlier floating variants were
rejected too). The style reference stays `docs/design/v3/`; this package only adds the toolbar.

Renders: `screenshot.png` (desktop 1280×800 at 2×, scrolled to Experience, `experience` active),
`screenshot-mobile.png` (phone 390×844 at 2×, the section menu open), both of the built page.

## Purpose

A visitor sees the CV's structure at a glance and jumps to any main block in one click.

## Structure

- A full-width **toolbar pinned to the top of the viewport**: `position: sticky; top: 0`, visible
  from the first frame (not revealed on scroll). It spans the whole viewport width, outside the
  page card; its content is aligned to the page card's inner edge (same left/right as the card's
  content).
- Background `--color-toolbar` (translucent white) with `backdrop-filter: blur(var(--toolbar-blur))`;
  1 px bottom border `--color-line`.
- **Left: the handle** `~/andrew.panasiuk/cv`, `--font-mono`, `--type-meta-size`, `--color-ink`,
  regular weight (`--type-meta-weight`, as in the meta bar; the human, 2026-10-16). It moves here
  from the meta bar; the meta bar keeps location, work mode and status.
- **The page top below** (the human, 2026-10-16): with the handle gone, on screens wider than
  960 px the meta bar sits at the header's top right and the photo, name and everything under
  them rise to its level (the photo's top level with the location line). At 960 px and narrower
  the meta bar stays above the header, right-aligned.
- **Right: the section list**, 9 items, lowercase, `--font-mono`, `--toolbar-link-size` (16 px),
  `--color-toolbar-link` (a muted violet: coloured, not grey, quieter than the accent; the human,
  2026-10-16):

| Label | Section id |
|---|---|
| skills | `skills` |
| impact | `impact` |
| projects | `projects` |
| experience | `experience` |
| craft | `craft` |
| process | `loop` |
| education | `education` |
| about | `about` |
| contact | `contacts` |

Labels are UI strings (home screen namespace), not CV data.

## Sizes

| | Desktop | Narrow (≤ 960 px; the phone ≤ 700 px) |
|---|---|---|
| Toolbar height | `--toolbar-height` 56 px | `--toolbar-height` 48 px (redefined under the phone query) |
| Item padding | 0 10 px (full toolbar height, so the underline sits on the bottom edge) | same |
| Handle ↔ list gap | 24 px; at 961–1100 px the handle hides so the labels fit, the list starts at the left | the handle on the header, else the current section |
| List | right-aligned, one line | folded into the section menu (below); side padding 16 px on the phone |

## States

- **Active**: the section crossing the reading line at 1/4 of the viewport height, or the last
  section when the page is scrolled to the bottom; none while the header is in view. Text
  `--color-accent` plus a 2 px `--color-accent` underline flush with the toolbar's bottom edge,
  rounded ends.
- **Hover**: text `--color-ink` (the accent is the active item's alone).
- **Focus-visible**: `--focus-ring` with `--focus-ring-offset`.
- **Narrow screens (≤ 960 px), the section menu** (variant M1, approved by the human on
  2026-10-16 over a burger with a full-screen menu): the bar shows the section being read on the
  left (accent, a 6 px accent dot before it; the handle while on the header) and a `sections`
  pill on the right (`--color-surface-lilac`, `--color-toolbar-link`, a chevron that flips when
  open; `aria-expanded`, `aria-controls`). It opens the list under the bar, full width: opaque
  `--color-card`, hairline bottom border, `--shadow-toolbar-menu`; one row per section, 12 px
  padding, `--radius-logo`, the number `01`–`09` at the end (`--type-label-size`, `--color-ink-4`);
  the active row on `--color-surface-lilac` in `--color-accent`. Picking a row closes the menu and
  scrolls; Escape (focus back on the pill) and a tap outside the bar close it. Nothing scrolls
  sideways.

## Behaviour

- Click an item: the page scrolls smoothly to the section (`behavior: 'instant'` under
  `prefers-reduced-motion: reduce`). The section heading lands below the toolbar: scroll margin =
  toolbar height + 24 px. The page agent's scroll uses the same margin.
- The chat's floating launcher and panel stay above the toolbar: `--toolbar-z-index` is below
  `--chat-z-index`.
- The Show case (retro show) hides the toolbar together with the meta bar (layer
  `hide-meta-bar`) until its chrome step brings them back.

## Accessibility

`<nav aria-label="Sections">`; items are `<button>`s; the active one has `aria-current="true"`.

## New tokens (`src/theme/tokens.css`)

| Token | Value |
|---|---|
| `--toolbar-height` | 56px; 48px at `width <= 700px` |
| `--toolbar-gap` | `--space-6` (handle ↔ list) |
| `--toolbar-item-padding-x` | `--space-2-5` |
| `--toolbar-link-size` | 16px |
| `--toolbar-underline-width` | 2px |
| `--toolbar-blur` | 14px |
| `--toolbar-z-index` | 900 (below `--chat-z-index` 1000) |
| `--color-toolbar` | `rgb(255 255 255 / 88%)` |
| `--color-toolbar-link` | `#5f4b8b` |
| `--shadow-toolbar-menu` | `0 16px 32px -12px rgb(139 92 246 / 30%)` |
| `--toolbar-dot-size`, `--toolbar-chevron-size` | 6px |
| `--toolbar-chevron-width` | 1.5px |

`--agent-scroll-margin-top` became `calc(var(--toolbar-height) + var(--space-6))`. Everything else
reuses existing tokens: `--color-ink`, `--color-ink-3`, `--color-accent`, `--border-rule`,
`--font-mono`, `--type-meta-size`, `--focus-ring`, `--focus-ring-offset`.
