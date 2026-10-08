# Stack Overflow card on the CV page

A card with Andrew's Stack Overflow stats (reputation, answers, badges, top answer tags, a link
to the profile) on the one CV page (`src/screens/home/`). Ticket CV-172, epic "Stack Overflow
widget" (feature branch `feature/stackoverflow`).

## Source

- Built from the brief's description (no screenshot), on 2026-10-08, in the v3 language
  (`docs/design/v3/`) over the real `src/theme/tokens.css`.
- `mock.html`: static mock (not product code) that rebuilds the bottom of the page (card row,
  footer CTA, ©) from the home screen's CSS. `?state=default|big|notags|nobadges|hover|empty`.
  `render.sh` renders every PNG below with headless Chrome (`frame.html` hosts the mock at an exact
  width). Scale: 1 image px = 1 CSS px.
- `screenshot.png`: desktop 1280. `assets/stackoverflow_mobile.png`: phone 390.
  `assets/stackoverflow_tablet_900.png`: the two-column wrap. States:
  `assets/stackoverflow_state_*_{desktop,mobile}.png`.
- Asset: `assets/stackoverflow_icon_logo.svg` (24×24 view box, `fill="currentColor"`), the Stack
  Overflow mark. The build copies it to `src/screens/home/assets/home_icon_stackoverflow.svg`.

## Placement

**Picked: a third card in the bottom card row, between Education and About me** (desktop:
Education · Stack Overflow · About me; phone: stacked in that order).

| Option | Verdict |
|---|---|
| A 5th tile next to the header's 2×2 stats | Rejected. The hero tiles are the pitch (12+, 1M+, 2, AI); a 666-reputation tile would compete with them, and badges + tags don't fit a tile. |
| A line or button in the header contacts | Rejected. Contacts are ways to reach Andrew; a stats line can't hold badges and tags, and a bare link hides the numbers. |
| A new "Community" section with an h2 | Rejected. A whole section (h2 + section gap ≈ 88 px) for one card is too heavy and adds a 10th block to a long page. |
| A card row after Selected impact | Rejected. Impact holds outcomes for products; SO stats are a side signal, not an impact story. |
| **Third card next to Education / About me** | **Picked.** That row is already "more about Andrew" in label + card form; the card kit (mono label, 24 px padding, tinted surface) fits as is. Education → Stack Overflow → About me reads professional → community → personal. Low on the page = present but not loud. |

## Colours

| Token | Value | Use | |
|---|---|---|---|
| `--color-surface-pink` | `#FDE6F3` | card fill (violet · **pink** · neutral, like Impact's lilac · pink · neutral) | existing |
| `--color-accent-pink` | `#C0267C` | label text and the SO mark (v3's "label on the pink card"; 4.7:1) | existing |
| `--color-ink` | `#16131C` | stat values, badge counts | existing |
| `--color-ink-3` | `#5E5770` | stat labels, badge words, tag caption, tag scores, "updated" (5.8:1 on pink) | existing |
| `--color-accent` | `#8A3FE0` | tag names, "View profile ↗" (4.6:1 on pink) | existing |
| `--color-accent-hover` | `#D9328F` | link hover | existing |
| `--color-card` | `#FFFFFF` | tag pill fill (the experience tags' lilac would vanish on pink) | existing |
| `--color-badge-gold` | `#F1B600` | gold badge dot | **new** |
| `--color-badge-silver` | `#9A9C9F` | silver badge dot | **new** |
| `--color-badge-bronze` | `#AB8253` | bronze badge dot | **new** |

The badge dots are Stack Overflow's own badge colours: the one place v3 has no role (metals). They
are decorative: the word next to each dot carries the meaning, so their low contrast on pink is
fine.

## Typography

All existing type tokens (`--type-<role>-*`, families `--font-sans` / `--font-mono`).

| Element | Token | Size / weight |
|---|---|---|
| Label "stack overflow" | `label` (mono) | 12.5 / 400 / 0.04em, as `HomeCard .label` |
| Stat values `666`, `20` | `stat` + `font-variant-numeric: tabular-nums` | clamp(26–34) / 600, −0.03em (same as the header tiles) |
| Stat labels "reputation", "answers" | `meta` | 14 / 400 |
| Badges "**1** gold" | `meta`; count weight `--type-company-weight` (600) | 14 |
| Caption "top tags · answer score" | `label` (mono) | 12.5 / 400 |
| Tag pill "android 46" | `tag` (mono) | 11.5 / 400 (same as the experience tags) |
| "View profile ↗" | `body` size, `--type-company-weight` | 16 / 600 |
| "updated Oct 8, 2026" | `period` (mono) | 12.5 / 400 |

## Layout

### Card row (change to `HomeScreen.module.css .cards`)

Today: `grid`, `repeat(auto-fit, minmax(min(100%, 320px), 1fr))`, gap `--space-2-5`. With three
cards a grid would leave a hole when only two columns fit (the third card in column 1, column 2
empty). So the row becomes **flex-wrap**: `display: flex; flex-wrap: wrap; gap: var(--space-2-5)`,
each card `flex: 1 1 min(100%, 320px); min-width: 0`. Cards in a line stretch to the same height.

- **viewport ≥ ≈1090 px** (three 320 px cards + 2 × 10 gap fit): three equal cards. At 1280: page card 1120,
  content 1043 (padding 38.4 × 2), cards ≈341 wide, inner 293.
- **≈725–1090 px**: Education + Stack Overflow on line 1, About me full width on line 2
  (`stackoverflow_tablet_900.png`).
- **< ≈725 px** (phone 390: content 346): one column, Education → Stack Overflow → About me.

### Card (`HomeStackOverflow`, new component in `src/screens/home/`)

Base: `HomeCard.module.css .root` (column flex, padding `--space-6` 24, radius `--radius-card` 24) +
a new `.pink` modifier: `gap: var(--space-4)` (16), `background: var(--color-surface-pink)`.
Top to bottom:

1. **Label row**: flex, `align-items: center`, gap `--space-1-5` (6). SO mark 16×16
   (`--label-icon-size`, new), tinted `--color-accent-pink` via `currentColor`; then
   "stack overflow" in `.label` style with colour `--color-accent-pink`.
2. **Stats**: flex-wrap, gap `--space-3` 12 (rows) × `--space-8` 36 (columns). Two stats, each a
   value (`stat` type) over a label (`meta`, `--color-ink-3`, `margin-top: --space-1` 4): exactly
   `HomeStats .value` / `.label`, without the tile. Reputation first, answers second.
3. **Badges** (`ul`, no bullets): flex-wrap, gap `--space-1-5` 6 × `--space-4` 16, `meta` type,
   `--color-ink-3`. Each `li`: flex, centred, gap 6: dot 8×8 (`--badge-dot-size`, new),
   `--radius-pill`, badge colour; count (600, `--color-ink`); the word.
   Order gold, silver, bronze.
4. **Top tags**: column, gap `--space-2` 8.
   - Caption "top tags · answer score": mono `label`, `--color-ink-3`.
   - List (`ul`): flex-wrap, gap `--space-1-5` 6. Each pill: padding `--tag-padding` (2 × 7), radius
     `--radius-book` 6, fill `--color-card`, mono `tag` type; name in `--color-accent`, then the
     score in `--color-ink-3` after `margin-left: --space-1-5` 6. `overflow-wrap: anywhere`, so a
     35-character tag on a phone breaks instead of overflowing. Order as in the data (by score).
5. **Footer**: flex-wrap, `align-items: baseline`, `justify-content: space-between`, gap 4 × 16,
   `margin-top: auto` (pinned to the bottom when the row stretches the card).
   - Link "View profile ↗": `--color-accent`, no underline, 16 / 600, gap 6 before the arrow.
   - "updated Oct 8, 2026": mono `period`, `--color-ink-3`.

Height at 1280 with today's data: ≈325, About me ≈325 too (`screenshot.png`), so the row stays even.

## Texts

Strings (`src/screens/home/strings.ts`, namespace `home`):

| Key (suggested) | Text |
|---|---|
| `stackOverflowLabel` | `stack overflow` |
| `stackOverflowReputation` | `reputation` |
| `stackOverflowAnswers` | `answers` (`answer` when the count is 1) |
| `stackOverflowGold` / `Silver` / `Bronze` | `gold` / `silver` / `bronze` |
| `stackOverflowTopTags` | `top tags · answer score` |
| `stackOverflowProfile` | `View profile` (the `↗` is `aria-hidden`, as on the contact buttons) |
| `stackOverflowUpdated` | `updated {date}` |
| `stackOverflowBadges` | `Badges` (the list's `aria-label`) |

Data texts: tag names verbatim from the data (lower case, as on Stack Overflow).

Formatting: numbers with `Intl.NumberFormat('en-US')` (`123,456`); the date with
`Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })`
→ `Oct 8, 2026` (UTC, so the ISO date never shifts a day).

## Icons and images

- **SO mark**: `assets/stackoverflow_icon_logo.svg`, single colour, tinted in code (`currentColor`),
  16×16, `aria-hidden`. Import it as a React component or inline SVG so `currentColor` works (an
  `<img>` can't be tinted). It is a bundled local file: CSP `img-src 'self'` holds.
- **Badge dots**: CSS circles, no image.
- No third-party images, avatars or iframes.

## States and behaviour

| State | What shows | Render |
|---|---|---|
| Default (today's data) | everything | `screenshot.png`, `stackoverflow_mobile.png` |
| Big numbers (6-digit reputation, 4–5-digit badges, long tags) | wraps, nothing clips; tag pills wrap per line | `stackoverflow_state_big_*` |
| 0 tags (`topTags: []`) | caption and list hidden; the footer stays at the bottom | `stackoverflow_state_notags_*` |
| A badge kind at 0 | that badge hidden; all three 0 → the badges list hidden | `stackoverflow_state_nobadges_desktop.png` (rep 1, 0 answers, 1 tag) |
| 1–4 tags | as many pills as there are; more than 5 in the data → show the first 5 | — |
| `answers: 1` | "answer" | — |
| No `stackOverflow` in the data | no card; the row is Education + About me as today | `stackoverflow_state_empty_desktop.png` |
| Hover / focus on "View profile" | `--color-accent-hover`; keyboard focus `--focus-ring` + `--focus-ring-offset`, radius 6 | `stackoverflow_state_hover_desktop.png` |

- **Link**: `profileUrl`, new tab (`target="_blank" rel="noopener noreferrer"`, the page's
  `linkProps`). Only the link is interactive; the card itself is not a link.
- **Semantics**: the card is a `section` labelled by its label; stats as plain text; badges and
  tags are lists. Screen readers hear "1 gold", "android 46".
- No loading or error state: the data is bundled with the page (as Education is).

## Responsive

One layout, wrapping by the rules above: desktop 1280 = three cards; 900 = two + one full width;
phone 390 = one column (card ≈346 wide, inner 298; today's tags take two lines).

## Data

From the brief (fixed): `cvPage.json` → `stackOverflow`:
`{ profileUrl, reputation, badges: { gold, silver, bronze }, answers, topTags: [{ name, score }], updatedAt }`.
A bot updates the numbers weekly. The card shows 1–6-digit numbers and 0–5 tags, as received.

## New tokens needed

| Token | Value | Why |
|---|---|---|
| `--color-badge-gold` | `#F1B600` | badge dot; v3 has no metal colours |
| `--color-badge-silver` | `#9A9C9F` | same |
| `--color-badge-bronze` | `#AB8253` | same |
| `--badge-dot-size` | `8px` | the dot (sizes have their own tokens in v3, not `--space-*`) |
| `--label-icon-size` | `16px` | a mark before a mono label; v3 has none (`--chat-hint-icon-size` is the chat's) |

## Shared components

None to move: the card reuses `HomeCard.module.css` (base + new `.pink`) and the stat value/label
look of `HomeStats`. The tag pill is the experience tag (`HomeTagLine .tag`) with a white fill; if
the build shares it, a `tone` modifier on one class beats a copy.

## Decisions (the orchestrator may change them)

1. Placement: third card between Education and About me (see Placement).
2. Card tone pink, label and mark in `--color-accent-pink`.
3. Badges with words ("1 gold"), not bare dots: recruiters don't know the dot code.
4. "updated" in `--color-ink-3`, not `--color-ink-4`: ink-4 on pink is 3.0:1, below AA for 12.5 px.
5. Badge kinds at 0 hidden (as Stack Overflow does); 0 answers / reputation still shown.
6. Full numbers with separators (`123,456`), not `123k`: the card has the room, and it's exact.
7. Page agent and chat: out of scope here. A follow-up should add the section to the page agent
   (`data-agent-id` `stackoverflow`, a contract change) and to the chat's knowledge
   (`server/chat/cvPageData.ts`), so the chat can talk about it and point at it.
8. Test ids (suggested): `home-stackoverflow` (card), `home-stackoverflow-tag`,
   `home-stackoverflow-profile`.

## Mock vs page

The mock's page card has a top padding (the real page starts with the meta bar) and a trimmed
footer CTA (two plain pills); only the card row is to be built from it.

## Orchestrator decisions (override the items above)

1. Decisions 1–6 and 8 accepted as written.
2. Decision 7 is overridden: the chat and the voice agent are **in scope of the build (CV-173)**.
   They must know the stats (chat knowledge `server/chat/knowledge/`, voice prompt
   `server/voice/prompt/`). The page agent target (`data-agent-id="stackoverflow"`) is added only if
   it needs no change to `src/data/chat/contract.ts`; otherwise it is left out and filed as a
   follow-up.
3. The five new tokens (`--color-badge-gold/silver/bronze`, `--badge-dot-size`,
   `--label-icon-size`) go into `src/theme/tokens.css` in the build task; no other task touches the
   theme now.
4. `mock.html`, `frame.html` and `render.sh` stay in the package as the renderer of the PNGs; they
   are not product code.
