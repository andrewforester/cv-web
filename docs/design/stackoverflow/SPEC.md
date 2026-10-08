# Stack Overflow card on the CV page

A compact card with Andrew's Stack Overflow stats (reputation, answers, badges, top answer tags, a
link to the profile) on the one CV page (`src/screens/home/`). Tickets CV-172 (the card), CV-177
(compact form, new placement); epic "Stack Overflow widget" (feature branch `feature/stackoverflow`).

## Source

- Built from the briefs (no screenshot), on 2026-10-08, in the v3 language (`docs/design/v3/`)
  over the real `src/theme/tokens.css`. The human's CV-172 feedback: the card's look is right, but
  it must be smaller and must not sit in the Education / About me row.
- The card: `card.css` + `card.js` (a static mock, not product code). `render.mjs` injects it into
  the **real built page** (`dist/`) at each placement and renders every PNG below with Playwright's
  Chromium: `npm run build && node docs/design/stackoverflow/render.mjs`. Scale: 1 image px = 1 CSS
  px; desktop 1280, phone 390. The floating "Ask my AI" button is hidden in the renders.
- `screenshot.png`: the recommended placement (option 1) at 1280. Options:
  `assets/stackoverflow_option_<n>_{desktop,mobile}.png`. States:
  `assets/stackoverflow_state_*_{desktop,mobile}.png`.
- Asset: `assets/stackoverflow_icon_logo.svg` (24×24 view box, `fill="currentColor"`), the Stack
  Overflow mark. The build copies it to `src/screens/home/assets/home_icon_stackoverflow.svg`.

## Placement

**Recommended: option 1, in the header, under the 2×2 stat tiles** (the right column of the
summary row). At 1280 the column under the tiles is empty today (the summary is ≈115 px taller
than the tiles); the card fills exactly that space, so the page gets no taller and nothing moves.

| # | Where | Desktop 1280 | Phone 390 | Pros | Cons |
|---|---|---|---|---|---|
| **1** | **Header, under the stat tiles** (recommended) | `stackoverflow_option_1_desktop.png`: 378×109, page +0 px | `stackoverflow_option_1_mobile.png`: after the tiles, before the contact buttons, page +117 px | Fills dead space, no layout shift; mostly on the first screen of a 1280×800 laptop (its bottom ≈20 px under the fold); evidence (a third-party profile) right next to the claims (12+, 1M+); one card layout everywhere | Near the pitch tiles, so more prominent than a "side signal" (the pink fill and smaller type keep it below the tiles); on a phone it pushes the contact buttons down by 117 px |
| 2 | **End of Experience**, a full-width strip after the last job | `stackoverflow_option_2_desktop.png`: one line, 1043×56, page +72 px | `stackoverflow_option_2_mobile.png`: the narrow card, page +125 px | Context: Android tags right after the Android jobs; the smallest footprint on desktop (one line) | Low on the page (≈ y 4950 of 5770); a second layout to build and test (`.wide`, from 1000 px); on a phone it sits right above the Education card, close to the row the human ruled out |
| 3 | **Footer CTA**, under "Let's build something" | `stackoverflow_option_3_desktop.png`: 460×109, page +57 px | `stackoverflow_option_3_mobile.png`: tags wrap, 302×155, page +175 px | Next to the ways to reach Andrew ("here is the proof, now write") | The lowest spot; the CTA gets busy; needs a tone variant (pink on the CTA's pink gradient vanishes, so the card turns white and its tags pink); the tallest on a phone |

Rejected in CV-172 and still out: a 5th stat tile (badges and tags don't fit a tile), a line in
the contact buttons (can't hold badges and tags), a new "Community" section (too heavy for one
card), a row after Selected impact (impact is product outcomes). The bottom card row is out by the
human's call, so the `.cards` grid stays as it is (no flex-wrap change).

### Option 1 in the header (the build)

`HomeHeader` → `.lead` (flex-wrap: summary `flex: 1 1 520px`, stats `flex: 1 1 280px`, gap
`--page-wide-gap`). The stats' `flex: 1 1 280px` moves to a new wrapper column `.side`:
`display: flex; flex-direction: column; gap: var(--space-2)` (8, the tiles' own gap; `min-width:
0`). Inside: `HomeStats` (unchanged), then the card. At 1280 the column is 378 wide; tiles 230 +
8 + card 109 = 347, the summary 346. When `.lead` wraps (content width < ≈850 px: 520 + 280 + the gap)
the column goes under the summary at full width, the card under the tiles.

## Colours

| Token | Value | Use | |
|---|---|---|---|
| `--color-surface-pink` | `#FDE6F3` | card fill | existing |
| `--color-accent-pink` | `#C0267C` | label text and the SO mark (4.7:1 on pink) | existing |
| `--color-ink` | `#16131C` | stat values, badge counts | existing |
| `--color-ink-3` | `#5E5770` | stat labels, tag scores (5.8:1 on pink) | existing |
| `--color-accent` | `#8A3FE0` | tag names, "View profile ↗" (4.6:1 on pink) | existing |
| `--color-accent-hover` | `#D9328F` | link hover | existing |
| `--color-card` | `#FFFFFF` | tag pill fill | existing |
| `--color-badge-gold` | `#F1B600` | gold badge dot | **new** |
| `--color-badge-silver` | `#9A9C9F` | silver badge dot | **new** |
| `--color-badge-bronze` | `#AB8253` | bronze badge dot | **new** |

The badge dots are Stack Overflow's own badge colours: the one place v3 has no role (metals).

## Typography

All existing type tokens (`--type-<role>-*`, families `--font-sans` / `--font-mono`).

| Element | Token | Size / weight |
|---|---|---|
| Label "stack overflow" | `label` (mono) | 12.5 / 400 / 0.04em |
| "View profile ↗" | `meta` size, `--type-company-weight` | 14 / 600 |
| Stat values `666`, `20` | `card-title` + `font-variant-numeric: tabular-nums` | 20 / 600 / −0.015em |
| Stat labels "reputation", "answers" | `meta` | 14 / 400 |
| Badge counts `1` `8` `19` | `meta` size, `--type-company-weight`, tabular | 14 / 600 |
| Tag pill "android 46" | `tag` (mono) | 11.5 / 400 (same as the experience tags) |

CV-172 used the `stat` size (26–34) for the values; `card-title` is what makes the card compact.

## Layout

### Card (`HomeStackOverflow`, new component in `src/screens/home/`)

Column flex, gap `--space-2` (8), padding `--space-4` (16), radius `--radius-tile` (20), fill
`--color-surface-pink`, `min-width: 0`. Same padding and radius as the stat tiles above it. Three
lines, top to bottom:

1. **Head**: flex-wrap, `align-items: center`, `justify-content: space-between`, gap 4 × 16.
   - Label: flex, centred, gap `--space-1-5` (6): SO mark 16×16 (`--label-icon-size`, new), tinted
     `--color-accent-pink` via `currentColor`; "stack overflow" (mono `label`, `--color-accent-pink`).
   - Link "View profile ↗": `--color-accent`, no underline, 14 / 600, gap `--space-1` (4) before
     the arrow; radius `--radius-book` (for the focus ring).
2. **Stats**: flex-wrap, `align-items: baseline`, gap `--space-1` 4 × `--space-3` 12, `meta` type,
   `--color-ink-3`. In order:
   - reputation: value (20 / 600, `--color-ink`, `margin-right: --space-1`) then "reputation";
   - answers: the same, "answers" ("answer" when 1);
   - badges (`ul`, no bullets): flex, centred, gap `--space-2-5` (10). Each `li`: flex, centred,
     gap 6: dot 8×8 (`--badge-dot-size`, new), `--radius-pill`, badge colour; count (14 / 600,
     `--color-ink`); the word ("gold") visually hidden for screen readers. Gold, silver, bronze.
   One line at 378 and at 346 with today's data; 6-digit numbers wrap the badges to a second line.
3. **Tags** (`ul`): flex-wrap, gap `--space-1-5` (6). The **first three** tags of the data (by
   score). Pill: flex, gap 6, padding `--tag-padding` (2 × 7), radius `--radius-book` (6), fill
   `--color-card`, mono `tag`, `white-space: nowrap`, `max-width: 100%`; name in
   `--color-accent` (`overflow: hidden; text-overflow: ellipsis; min-width: 0`), score in
   `--color-ink-3` (`flex: none`). Pills wrap whole to a second line only when the line is too
   narrow; a single tag longer than the line ellipsizes its name, never its score.

Height with today's data: 109 (16 + head 17 + 8 + stats 24 + 8 + tags 20 + 16). CV-172's card was
341×325.

### Only for the other options (not built unless picked)

- Option 2 `.wide` (≥ 1000 px viewport): `flex-flow: row wrap; align-items: center; gap: 8 × 24`;
  the head becomes `display: contents`, the link gets `order: 1; margin-left: auto`, so the line is
  label · stats · tags … View profile. Below 1000 px: the normal card.
- Option 3 `.onTint`: card fill `--color-card`, tag pills `--color-surface-pink`. The CTA's
  `h2` and the card share a column (`flex: 1 1 300px`, gap `--space-5`).

## Texts

Strings (`src/screens/home/strings.ts`, namespace `home`):

| Key (suggested) | Text |
|---|---|
| `stackOverflowLabel` | `stack overflow` |
| `stackOverflowReputation` | `reputation` |
| `stackOverflowAnswers` | `answers` (`answer` when the count is 1) |
| `stackOverflowGold` / `Silver` / `Bronze` | `gold` / `silver` / `bronze` (visually hidden after the count; also the `li`'s `title`) |
| `stackOverflowBadges` | `Badges` (the badge list's `aria-label`) |
| `stackOverflowTopTags` | `Top tags by answer score` (the tag list's `aria-label`) |
| `stackOverflowProfile` | `View profile` (the `↗` is `aria-hidden`, as on the contact buttons) |

Data texts: tag names verbatim from the data (lower case, as on Stack Overflow). Numbers with
`Intl.NumberFormat('en-US')` (`123,456`).

**Dropped from the CV-172 card to make it compact** (content the human fixed stays: reputation,
gold/silver/bronze, answers, top tags, profile link):

- The visible badge words ("1 gold"): the metal colours carry it; the words stay for screen readers
  and as a hover `title`. They cost a second line at the header's width.
- The caption "top tags · answer score": now the list's `aria-label`; the mono score next to each
  tag reads on its own.
- Tags 4 and 5: the top three fit one line at every width the card takes.
- "updated Oct 8, 2026": a weekly bot keeps the numbers fresh; the date stays in the data (the chat
  and the voice agent may use it).

## Icons and images

- **SO mark**: `assets/stackoverflow_icon_logo.svg`, single colour, tinted in code (`currentColor`),
  16×16, `aria-hidden`. Import it as a React component or inline SVG so `currentColor` works (an
  `<img>` can't be tinted). A bundled local file: CSP `img-src 'self'` holds.
- **Badge dots**: CSS circles, no image.

## States and behaviour

| State | What shows | Render |
|---|---|---|
| Default (today's data) | everything, 378×109 | `screenshot.png`, `stackoverflow_option_1_*` |
| Big numbers (6-digit reputation, 5-digit badges, long tags) | badges wrap under the stats, tags one per line; nothing clips | `stackoverflow_state_big_{desktop,mobile}.png` (180 tall; the header grows by 66 px at 1280) |
| 0 tags (`topTags: []`) | the tag line is gone (82 tall) | `stackoverflow_state_notags_desktop.png` |
| A badge kind at 0 | that badge hidden; all three 0 → the badge list hidden | `stackoverflow_state_nobadges_desktop.png` (rep 1, 1 answer, 1 tag) |
| `answers: 1` | "answer" | same render |
| 1–2 tags | as many pills as there are | — |
| No `stackOverflow` in the data | no card; the header is as today | — (today's page) |
| Hover / focus on "View profile" | `--color-accent-hover`; keyboard focus `--focus-ring` + `--focus-ring-offset` | `stackoverflow_state_hover_desktop.png` |

- **Link**: `profileUrl`, new tab (the page's `linkProps`). Only the link is interactive.
- **Semantics**: the card is a `section` labelled by its label; stats as plain text; badges and
  tags are lists. Screen readers hear "666 reputation", "1 gold", "android 46".
- No loading or error state: the data is bundled with the page.

## Responsive

One card layout, wrapping by the rules above. Desktop 1280: under the tiles, 378 wide. Phone 390:
the summary column stacks (summary, tiles, card, contacts), card 346 wide, today's data on three
lines as on desktop.

## Data

From the CV-172 brief (fixed): `cvPage.json` → `stackOverflow`:
`{ profileUrl, reputation, badges: { gold, silver, bronze }, answers, topTags: [{ name, score }], updatedAt }`.
The card shows `topTags[0..2]` and doesn't show `updatedAt`.

## New tokens needed

| Token | Value | Why |
|---|---|---|
| `--color-badge-gold` | `#F1B600` | badge dot; v3 has no metal colours |
| `--color-badge-silver` | `#9A9C9F` | same |
| `--color-badge-bronze` | `#AB8253` | same |
| `--badge-dot-size` | `8px` | the dot (sizes have their own tokens in v3, not `--space-*`) |
| `--label-icon-size` | `16px` | a mark before a mono label; v3 has none |

Same five as CV-172; the compact card needs no others.

## Shared components

None to move. The card sits next to `HomeStats` and borrows its tile padding and radius, not its
component. The tag pill is the experience tag (`HomeTagLine .tag`) with a white fill; if the build
shares it, a `tone` modifier on one class beats a copy.

## Decisions (the orchestrator may change them)

1. Placement: option 1, header under the stat tiles (see Placement).
2. Card tone pink, label and mark in `--color-accent-pink` (as CV-172).
3. Badges as coloured dots + counts; the words are visually hidden and in a `title` (CV-172 showed
   the words; dropping them keeps the stats on one line at 346–378 px).
4. Three tags, not five; no visible caption; no "updated" date.
5. Badge kinds at 0 hidden; 0 answers / reputation still shown (as CV-172).
6. Full numbers with separators (`123,456`), not `123k` (as CV-172).
7. Test ids (suggested): `home-stackoverflow` (card), `home-stackoverflow-tag`,
   `home-stackoverflow-profile`.

## Orchestrator decisions (override the items above)

1. CV-172's decisions 1–6 and 8 were accepted for the old card; for this compact card the
   **Decisions** list above replaces them until the orchestrator accepts or changes it.
2. The chat and the voice agent are **in scope of the build (CV-173)**. They must know the stats
   (chat knowledge `server/chat/knowledge/`, voice prompt `server/voice/prompt/`). The page agent
   target (`data-agent-id="stackoverflow"`) is added only if it needs no change to
   `src/data/chat/contract.ts`; otherwise it is left out and filed as a follow-up.
3. The five new tokens (`--color-badge-gold/silver/bronze`, `--badge-dot-size`,
   `--label-icon-size`) go into `src/theme/tokens.css` in the build task; no other task touches the
   theme now.
4. `card.css`, `card.js` and `render.mjs` stay in the package as the renderer of the PNGs; they
   are not product code (CV-177 replaced CV-172's `mock.html`, `frame.html`, `render.sh`).
