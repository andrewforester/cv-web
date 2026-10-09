# Motion: CV page animations (design package)

## Overview
Animations for the web CV page (`CV Senior Product Engineer v3`): an intro sequence on load, reveals as you scroll, a scroll progress bar, light parallax, and hover effects. Layout, colors and copy stay the same. **This bundle covers motion only.**

## About the design files
`CV Senior Product Engineer v3.dc.html` is a **design reference in HTML**, not production code. Rebuild the behavior in the target codebase with its own tools: Framer Motion / Motion One / GSAP / CSS + IntersectionObserver. In the reference, all motion is in the `initMotion(level, tn)` function inside the logic block, written with the Web Animations API.

## Fidelity
High-fidelity: durations, delays, easings and offsets below are final.

## Global settings
- **Motion levels** (prop `motion`): `Full` (default) | `Subtle` | `Off`.
  - `Subtle`: every offset, scale and rotation is multiplied by **k = 0.35**. No infinite loops, 3D tilt, cursor spotlight, parallax, highlight run on the loop cards, or arrow wobble.
  - `Off` and `prefers-reduced-motion: reduce`: no animation at all, content shows immediately.
- **Easings**
  - `EASE` = `cubic-bezier(.16,1,.3,1)` (default, 900ms unless noted).
  - `SPRING` = `cubic-bezier(.34,1.56,.64,1)`.
- **Reveal on scroll**: IntersectionObserver with `threshold: 0`, `rootMargin: 0 0 -10% 0`. **Plays once**: after it fires, the element is no longer observed.
- **Typical keyframes** (from → to):
  - `up(y, s)`: `opacity 0, translateY(y·k) scale(1-(1-s)·k)` → `opacity 1, none`.
  - `side(x, r)`: `opacity 0, translateX(x·k) rotate(r·k deg)` → `opacity 1, none`.
- **Theme colors**: the TnAir theme (prop `theme`) only changes colors.

| | Default | TnAir |
|---|---|---|
| Highlight pink | `#FF7ACB` | `#E0145A` |
| Highlight glow | `rgba(255,79,184,.55)` | `rgba(224,20,90,.55)` |
| Gradient | `#FF4FB8 → #8B5CF6 → #FF4FB8` | `#E0145A, #7A3BD9, #3B5BDB, #7A3BD9, #E0145A` |

## 1. Intro sequence (on load)
| Element | Animation | Delay | Duration / easing |
|---|---|---|---|
| Nav | opacity 0→1, translateY −12px→0 | 0 | 700, EASE |
| Avatar | opacity 0→1, scale(1−.5k) rotate(−12k°) blur(8k px) → none | 100 | 1100, SPRING |
| Name/role block | `side(−24)` | 250 | 900 |
| H1 | translateY(.45k em) skewY(4k°), clip-path `inset(0 0 100% 0)` → `inset(-20% -5% -20% -5%)` | 300 | 1300 |
| H1 gradient word ("Product") | background-position 0%→100%, size 200%, alternate, **infinite** (Full only) | — | 3500, ease-in-out |
| Lead paragraph | `up(24)` | 550 | 900 |
| Stat cards (4) | `up(30, .92)` | 650 + i·90 | 900 |
| Stat values | count up from 0 (see "Number count") | 750 + i·90 | 1400 |
| Header buttons | `up(16, .96)` | 900 + i·70 | 900 |
| "Ask my AI" FAB | translateY(40k) scale(1−.2k) → none | 1500 | 900, SPRING |
| FAB pulse | box-shadow `0 0 0 0 rgba(139,92,246,.55)` → `0 0 0 14px …0`, **infinite** (Full only) | 2600 | 2000, ease-out |

### Number count
- Ease-out-expo `1 − 2^(−10p)`, 1400ms. Text is restored exactly at the end.
- `12+` → 0…12+.
- `1M+` → counts 0…1000 shown as `NK+`, then shows `1M+`.
- Non-numeric values (`AI`) don't move: no scramble (Orchestrator decisions 8).

## 2. Sections (on scroll, once)
Every section heading (h2 block): `up(30)`.

**Highlight cards (2-column)**: cards `side(±80, ±2°)`, 1100ms, delay 100 + i·120. Left comes from the left, right from the right. Plus 3D tilt (§4).

**"How I build with agents" (dark panel)**
- Panel: translateY(60k) scale(1−.06k), clip-path `inset(6% 3% 6% 3% round 28px)` → `inset(0 round 28px)`, 1200ms.
- Intro paragraph: `up(24)`, delay 200.
- Loop cards 01–06: `up(28, .94)`, delay 350 + i·110.
- **One-time highlight run** (Full only, no loop) on each card, 1200ms ease-out, delay 1100 + i·220:
  - 0%: border `#3A3248`, no shadow, bg transparent.
  - 30%: border = pink, box-shadow `0 0 0 1px pink, 0 14px 36px -12px glow`, bg `rgba(255,255,255,.04)`.
  - 100%: back to the base state.
- Last line "typewriter": clip-path `inset(0 100% 0 0)` → `inset(0 0 0 0)`, `steps(56,end)`, 1800ms, delay 400 + n·110.
- Cursor spotlight (Full only): absolutely positioned circle, 420×420, `radial-gradient(circle, rgba(255,79,184,.26), rgba(139,92,246,.12) 40%, transparent 70%)`, z-index −1 (the panel has `isolation:isolate; overflow:hidden`). Follows the cursor with a 500ms ease-out lag, fades out over 600ms on mouseleave.

**Impact cards (stat grid)**
- Cards: translateY(70k) rotate(3k°) scale(1−.1k) → none, 1100ms SPRING, delay i·130.
- Values count up (as above), delay 200 + i·130.
- 3D tilt.

**Skills grid**: `side(−30)`, delay (i mod 2)·90 + floor(i/2)·110.

**Experience**
- Each `article`: `up(40)`.
- Company logo: scale(1−.6k) rotate(−20k°) → none, SPRING, delay 120.
- Bullets: `side(−18)`, delay 220 + i·80.
- Project branches (dashed connector):
  - vertical line `scaleY 0→1` (origin top), 700 ease-out;
  - then horizontal `scaleX 0→1` (origin left), 400, delay 400;
  - then content `side(30)`, delay 500.

**Education / certificates**
- Columns `side(±60)`, 1100ms, delay i·120, 3D tilt.
- Badges: translateY(40k) rotate(−14k°) → none, SPRING, delay 350 + i·110.

**CTA "Let's build something"**
- Block: scale(1−.08k), clip-path `inset(10% 6% 10% 6% round 28px)` → `inset(0 round 28px)`, 1200ms.
- Arrow ↗ (Full only): translate(0,0) → (6px,−6px) → (0,0), 900ms ease-in-out, **2 iterations**, starts 900ms after the block is revealed, then stops.
- Background (Full only): background-position 0%→100%, size 220%, alternate, infinite, 7000ms.

## 3. Scroll-linked
- **Progress bar**: `position:fixed; top:0; left:0; right:0; height:3px; z-index:20`, background `linear-gradient(90deg,#FF4FB8,#8B5CF6)`, `transform-origin:0 50%`, `scaleX = scrollY / (scrollHeight − innerHeight)`. Updated with rAF throttling.
- **Parallax** (Full only), **stat cards in the header only**. translateY added on top of the existing transform (`composite: add`) over scrollY 0…900px:
  - odd cards (i % 2 = 1): 0 → −70px;
  - even cards: 0 → −30px.
  - ⚠️ The **H1 and the avatar row have no parallax** (removed on purpose).

## 4. Hover
**3D tilt** (Full only, only after the element's reveal has finished):
- `perspective(800px) rotateX(−y·8°) rotateY(x·10°) translateY(−4px)`, where x, y ∈ [−.5, .5] is the cursor position relative to the card. 250ms ease-out.
- On mouseleave: back to 0, 600ms EASE.
- Applied to: highlight cards, impact cards, education columns.

## Implementation notes
- Once a reveal animation finishes, its effect is removed, so the element's own styles (hover etc.) work again.
- The cleanup function removes listeners and observers, cancels animations and restores the text of the counters. It re-runs when `motion` or `theme` changes.
- Before hydration, elements must not flash: either set `opacity:0` in SSR for reveal targets, or start the animation before first paint.
- Print/PDF version: no animations.

## Files
- `reference.dc.html`: the designer's HTML reference (Claude Design export, kept verbatim; it needs the design tool's `support.js`, which is not included, so read it as code). Motion lives in `initMotion()` in the logic block. Its layout, copy and colours are older than the site: don't take anything but motion from it.

## Orchestrator decisions
These override anything above that conflicts with them.

1. **Motion only.** Copy, colours, layout and markup of the reference are not used; where the reference and the live page (`docs/design/v3/`, `src/screens/home/`) differ, the live page wins. An animation whose element doesn't exist on the page is skipped; the scroll progress bar is the one new element (it is motion).
2. **"Ask my AI" FAB pulse: exactly 2 pulses** after the FAB's entry (start 2600 ms after load, 2000 ms each, ease-out), then it stops. Not infinite (the human, 2026-10-09).
3. **Levels:** the site has only `Full`, and `Off` when `prefers-reduced-motion: reduce`. No `Subtle` level, no switch in the UI. The `TnAir` theme is ignored.
4. **Colours** of glows, borders and gradients come from the existing tokens (`src/theme/tokens.css`); a value with no matching token becomes a new token. Easings and durations become motion tokens too.
5. **No new dependencies:** CSS, IntersectionObserver and the Web Animations API (no Framer Motion / GSAP).
6. **Never hidden content:** without JS, with reduced motion, in print, in the Show case (`src/screens/retro`, which renders the page itself) and when the page agent scrolls to or highlights an item, all content is visible. Hidden start states are applied by JS just before the animation, never in static CSS.
7. **Tests and screenshots:** the e2e and web check run with reduced motion, so full-page screenshots show every section; the motion itself is covered by unit tests.
8. **No scramble on non-numeric stat values** (`AI`); they appear with their card.
