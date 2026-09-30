# Retro Rebuild show (web) — design package

## Source

- Designed from the brief of Linear **GRA-38** and the project *Retro Rebuild* (30 Sep 2026). **No screenshot or Figma frame exists.** The end state is today's design unchanged (`docs/design/cv/SPEC.md`, `src/theme/tokens.css`); everything else here is drawn from 1998–2006 references (below).
- `mock.html`: a static HTML/CSS mock. It holds **one** CV markup (all sections of `src/data/mock/cv.en.json`, real images from `../cv/assets/`) styled with the real `src/theme/tokens.css`, which gives today's design. The 2002 look is a stack of **damage layers**, one CSS block each, switched on by `<html data-dmg="fonts colours layout images cards rhythm chrome links">`. A fix step removes layers. So the package itself checks that every deviation is reversible and that no layer left = today's design. Query params: `?state=broken|chat|console|step1-mid|step1|step2-mid|step2|end`, `&dock=0` (no chat/console), `&dmg=<layers>` (any combination).
- Renders are 1× (CSS px = image px), made by `render.sh` (headless Chrome, reduced motion, so marquee and carets hold still). **Render on macOS or Windows:** the retro faces (Verdana, Times New Roman, Comic Sans MS, Arial) are the "core fonts for the web", and Linux substitutes them.

| File | Viewport | Shows |
|---|---|---|
| `01-broken.png` | 1280 × 800 | t = 0: the broken 2002 page alone |
| `02-chat.png` | 1280 × 800 | page + terminal chat (opening line, one exchange, visitor typing) |
| `03-console.png` | 1280 × 800 | console open above the chat, step 1 starting (**before step 1**) |
| `04-step1-mid.png` | 1280 × 800 | **mid-step**: step 1's font hunk is applied (Inter), the colour hunk is being typed |
| `05-after-step1.png` | 1280 × 800 | **after step 1** = before step 2: Inter, navy on white, layout still 2002 |
| `06-step2-mid.png` | 1280 × 800 | step 2 typing, page not moved yet |
| `07-after-step2.png` | 1280 × 800 | **after step 2**: centred 672 px column, header in two columns |
| `08-end.png` | 1280 × 800 | after step 7: today's design, console at 100 %, chat stays |
| `full-broken.png`, `full-after-step2.png` | 1280 × 3000 | whole page without the dock, for the deviation list |

`08-end.png` is the mock's approximation of today's site. The real site is the reference for the end state, not this image.

## References and direction

Real pages and collections from about 1996–2006, checked 30 Sep 2026:

| # | Reference | What we borrow |
|---|---|---|
| 1 | [Space Jam (1996), spacejam.com/1996](https://www.spacejam.com/1996/) | Tiled star-field background: the "space" homepage tile. |
| 2 | [GeoCities special collection, Internet Archive](https://archive.org/web/geocities.php) | The whole genre: fixed-width table page on a tiled background. |
| 3 | [OoCities, the GeoCities mirror](https://www.oocities.org/) | Real personal homepages as they were left in 2009. |
| 4 | [Resume of a Lotus Notes developer, oocities](https://www.oocities.org/siliconvalley/vista/4059/resume.html) | A developer CV as a homepage: `<hr>` between sections, bold headings, a "Back to Main" link row. |
| 5 | [Resume of Gagan Bindra, oocities](https://www.oocities.org/gaganbindra/resume.htm) | A row of GIF nav buttons (Home, Resume, Projects, My Photos) over a CV: our bevelled nav bar. |
| 6 | [Cameron's World](https://www.cameronsworld.net/) | Collage of GeoCities GIFs: "NEW!" bursts, counters, construction signs, guestbook badges. |
| 7 | [GifCities, Internet Archive](https://gifcities.org/) | The GIF vocabulary (starbursts, broken-image look, animated dividers). We draw our own; nothing is copied. |
| 8 | ["This Page Is Under Construction", textfiles.com (Jason Scott)](http://www.textfiles.com/underconstruction/) and [the Archive Team write-up](https://ascii.textfiles.com/archives/2236) | The yellow and black construction sign with a little digger. |
| 9 | [Web counter, Wikipedia](https://en.wikipedia.org/wiki/Web_counter) | The odometer hit counter: "You are visitor number 004271". |
| 10 | [Web badge, Wikipedia](https://en.wikipedia.org/wiki/Web_badge) | 88 × 31 buttons: "best viewed at 800×600", "sign my guestbook". |
| 11 | [Microsoft FrontPage in 1996, Web Design Museum](https://www.webdesignmuseum.org/gallery/microsoft-frontpage-1996) | The WYSIWYG-editor look: centred headings, beveled buttons, default blue underlined links. |
| 12 | [Golden Age of Web Design 2000–2005, Web Design Museum](https://www.webdesignmuseum.org/golden-age-of-web-design) and [00s style gallery](https://www.webdesignmuseum.org/styles/00s) | Era check: Verdana 10–11 px body, Times headings, 640–760 px fixed tables. |
| 13 | [98.css (Jordan Scales, MIT)](https://jdan.github.io/98.css/) | Reference for the Windows 98 window chrome of the chat and console (bevel colours, title gradient). We don't import it; the chrome is a few lines of CSS. |

**Direction: "a 2002 personal homepage, made in FrontPage, hosted on GeoCities".** It is one coherent page, not a collage: a fixed 640 px table hard against the left edge, on a star tile; Verdana 11 px body, Times New Roman headings in red, a purple name; a bevelled grey nav bar, a Comic Sans marquee, blinking "NEW!" bursts, `<hr>` under every heading, default blue underlined links; images that 404; and a footer with a construction sign, hit counter, badges and a webring. The CV text stays exactly the same (a job-seeker's CV: the jokes are in the furniture, never in the content). The agent's tools are **Windows 98 windows with terminals inside**: the same era as the page, so the whole screen reads as 2002, while the agent's code is clearly 2026.

## What it is

The visitor opens the CV and sees it as a broken 2002 homepage. After a few seconds a terminal-style chat opens on the right ("oops, looks like this site got stuck in 2002…"), then a console above it where an "agent" types real CSS/TS diffs. Each diff lands on the page as soon as it's typed. In 7 steps the page becomes today's design. An LLM writes the chat commentary and answers the visitor (project decision: hybrid); the steps themselves are authored and deterministic. This package designs how it looks and reads; the mechanism is GRA-39.

## Screen layout during the show (1280 × 800, desktop only)

```
x: 0                                                   880        1264 1280
   ┌─ page area (viewport − dock) ───────────────────┐  ┌─ dock ───────┐
   │ broken: 640 px table at x = 8                   │  │ console       │  y 16
   │ fixed:  672 px column centred in the page area  │  │ (fills)       │
   │                                                 │  ├───────────────┤  gap 12
   │                                                 │  │ chat  344 px  │
   └─────────────────────────────────────────────────┘  └───────────────┘  y 784
```

- **Dock**: `position: fixed`, `top`/`right`/`bottom` 16 px (`--retro-dock-inset`), width 384 px (`--retro-dock-width`), column flex anchored to the bottom, 12 px gap (`--retro-dock-gap`). Chat: fixed height 344 px (`--retro-chat-height`). Console: the rest (≈ 412 px at 800 px tall). Before the console exists, the chat sits alone at the bottom.
- **Page area**: while the dock is shown, the page gets `margin-right: calc(var(--retro-dock-width) + 2 * var(--retro-dock-inset))` (416 px), so the page lays out in 864 px and the dock never covers content. The broken page is left-aligned, so reserving the space when the chat appears moves nothing. After step 2 the 672 px column is centred in the 864 px area (x ≈ 96–768).
- The page scrolls under the fixed dock; the dock never scrolls.
- **No AI chat button (FAB) and no language switcher** during the show (brief: no chat button; project: EN only). See Decisions.

## Timeline

| t | What happens |
|---|---|
| 0 s | Page alone, fully broken. Marquee scrolls, "NEW!" bursts blink (1 s steps). |
| 3 s | Chat window appears (instant, like a Win98 window; no animation). Two system lines appear at once; then the agent's opening line types at 40 chars/s (≈ 3 s). The input is usable from now on. Focus is **not** moved into it. |
| ≈ 7.5 s | Agent: "Opening my console…" (typed). 1 s later the console window appears above the chat and types the prompt line. |
| ≈ 9 s → | Steps 1…7 run one after another (below). Visitor messages can arrive at any time; the agent answers in the chat while the console keeps going. |
| end | Console shows all 7 steps ✓ and 100 %; agent's closing line in the chat. Both windows stay; the chat keeps answering. |

**Inside a step** (console):
1. The step comment line types (40 chars/s): `# 1/7 fonts & colours: …`.
2. The diff types line by line at ≈ 60 chars/s; a whole `-` line appears at once (it's "selected and deleted"), `+` lines type.
3. A step is made of **hunks** (a group of lines that change one thing). When a hunk's last line is typed, its damage layer is removed from the page **at that moment** (no transition, as a browser reload of CSS would do), and a line `✓ <what> applied` is printed. So the page never runs ahead of or behind the code.
4. After the step: 800 ms pause, `✓ n/7 <name>`, the agent posts one comment in the chat (LLM, with the scenario's line as the fallback), 1.5 s pause, next step. When the next step starts, the finished step's diff collapses into its single `✓ n/7 <name>` line.
5. A step takes ≈ 10–15 s; the full show ≈ 90–110 s; the POC (steps 1–2) ≈ 30 s.

Progress: `(finished steps + share of the current step's characters typed) / 7`, shown as a Win98 block bar with a label `Step n of 7: <name>` and the percentage.

`prefers-reduced-motion`: marquee is static (text starts at the left), no blinking (bursts and carets stay visible), and console/chat lines appear whole instead of character by character (same pacing per line).

## The broken page, as deviations from today's design

Each row is one deviation: today's value → retro value → the layer (and the step) that removes it. Retro values are **not** tokens of the theme: they belong to the damage layers and disappear with them. Today's values are in `docs/design/cv/SPEC.md` and `src/theme/tokens.css`.

### Global

| What | Today | Retro | Layer (step) |
|---|---|---|---|
| Font family | `--font-family` Inter | `Verdana, Geneva, sans-serif` | fonts (1) |
| Heading family (name, section titles, company, subsection) | Inter | `'Times New Roman', Times, serif`, bold | fonts (1) |
| Card and app titles | Inter 600 / 500 | `Arial, Helvetica, sans-serif` bold | fonts (1) |
| Letter-spacing | `--letter-spacing` 0.02em | `normal` | fonts (1) |
| Type sizes (size / line-height) | name 24/24, section 21/22, subsection 17/17, body 15/22, card title 15/16, card body 14/20, meta 14/14, education 17/21, book 15 and 13, app 17/9/15/12 | name 34/38, section 24/28, subsection 15/18, body 11/15, card title 12/15, card body 11/14, meta 11/14, education 13/16, book 11/13 and 10/12, app 13/10/11/10 | fonts (1) |
| Page background | `--color-bg` white | `#000033` + `assets/retro_tile_stars.svg` tiled | colours (1) |
| Content background | white | `#FFFFCC` (the table's `bgcolor`) | colours (1) |
| Text | `--color-text` `#001670` | `#000000` | colours (1) |
| Secondary text (job titles, dates) | `--color-text-secondary` `#445598` | `#008000` | colours (1) |
| Muted ("remotely") | `rgba(0,22,112,.6)` | `#808080` | colours (1) |
| Name colour | text | `#800080` | colours (1) |
| Section title colour | text | `#CC0000` | colours (1) |
| App card colours | text `#202124`, muted `#717479`, accent green, border green | `#000000`, `#666666`, `#0000FF`, `#000000` | colours (1) |
| Page frame | `.shell` max 672 + 2 × 24 px gutter, centred | fixed `width: 640px`, `margin: 0`, page `padding: 8px` (body margin), `border: 3px outset #C0C0C0`, `padding: 6px` (cellpadding): a table at x = 8 | layout (2) |
| Links | text colour, underline on hover only | `#0000EE`, always underlined | links (7) |

### Header

| What | Today | Retro | Layer (step) |
|---|---|---|---|
| Arrangement | grid: intro left; photo + contacts right-aligned | `text-align: center` block; photo `float: left` (8 px right gap); contacts in one centred line under the photo (`clear: both`, 6 px above) | layout (2) |
| Photo | 120 px circle, `photo.jpg` | **broken**: 120 × 120 box, `border: 1px inset #C0C0C0`, broken-image icon + alt text `photo.jpg` (11 px Verdana, black) | images (3) |
| Tagline gap | 20 px | 2 px | rhythm (5) |
| Contacts | Gmail icon + address; WhatsApp + Telegram icons + phone | icons hidden; bold labels `E-mail me:` and `Phone:` before blue underlined links, 4 px apart | links (7) |
| "Oh, snap!" note | none | see *2002 furniture* | images (3) |

### Summary

| What | Today | Retro | Layer (step) |
|---|---|---|---|
| Title | 30 px above, 12 px below | 16 px above, 2 px below, then `<hr>`: 2 px `groove #C0C0C0`, 8 px below | rhythm (5) |
| Lines | plain lines | `list-item`, `disc`, 28 px indent | rhythm (5) |

### Technologies

| What | Today | Retro | Layer (step) |
|---|---|---|---|
| Title | left | `text-align: center` (a `<center>` on one title only: crooked on purpose) | layout (2) |
| Grid | 3 columns, column gap 30, row gap 18 | 3 columns, gaps 2 px (cellspacing) | layout (2) |
| Card | white, 1 px `--color-card-border`, radius 12, `--shadow-card`, padding 12/15, 6 px title gap | table cell: `2px inset #C0C0C0`, radius 0, no shadow, padding 4, 2 px title gap | cards (4) |
| Card fill | white | `#CCFFFF`; *Product mindset* `#FFFF00`; *AI Tools* `#FFCCFF` | colours (1) |
| Highlight star, AI gradient border | shown | hidden (plain inset border) | cards (4) |
| *AI Tools* title | — | blinking "NEW!" burst after it | chrome (6) |

### Latest relevant experience / Previous Experience (same entry)

| What | Today | Retro | Layer (step) |
|---|---|---|---|
| Entry head | grid: logo 36 · company + role · dates right | block: logo `float: left` (6 px gap); company, role and dates on their own lines; dates italic | layout (2) |
| Logos | 36 px, radius 9, `contain` | **Transcenda broken** (36 × 36 box, alt `logo_transcenda.png` clipped); all others **squashed** to 64 × 28 (`object-fit: fill`), radius 0; the logo column grows to fit | images (3) |
| Bullets | plain lines, 9 px under the head | `list-item`, `square`, 28 px indent, 2 px under the head | rhythm (5) |
| Entries gap | 30 px | 12 px | rhythm (5) |
| "Latest relevant experience" title | — | blinking "NEW!" burst after it | chrome (6) |

### Apps

| What | Today | Retro | Layer (step) |
|---|---|---|---|
| Row | 3 cards in a row, gap 16 | stacked full-width cards, 4 px apart, whole block indented 40 px (a `<blockquote>` misused for indent) | layout (2) |
| Card | white, 0.75 px green border, radius 12, shadow, padding 15 | `#CCFFCC`, 1 px black border, radius 0, no shadow, padding 4 | colours (1), cards (4) |
| Icons | 36 px, radius 9 | Savant icon **broken** (36 × 36 box); others radius 0 | images (3), cards (4) |

### Education

Only the global deviations (Times title in red, `<hr>`, Verdana 13 px lines, black text).

### About me

| What | Today | Retro | Layer (step) |
|---|---|---|---|
| Books row | gap 37 | gap 12 | layout (2) |
| Covers | 100 × 150, `--shadow-book` | `2px solid #000` border (`border=2`), no shadow; **Siddhartha broken** (100 × 150 box, alt `book_siddhartha.jpg`) | cards (4), images (3) |
| Subtitles | 12 px below; Interests 30 px above | 4 px below; 12 px above | rhythm (5) |

### 2002 furniture (exists only in the broken page)

All of it is removed by **chrome (6)**, except the note (images, 3).

| Element | Where | Look |
|---|---|---|
| Nav bar | top of the table, full width, 6 px below | `#000080` strip, 3 px padding, centred buttons `Home` `Resume` `My Apps` `Books` `Guestbook` `Links`: `#C0C0C0`, `2px outset #FFF`, padding 2 × 10, bold Verdana 11/14, black, underlined. Dead links. |
| Marquee | under the nav, 8 px below | black strip, 1 px `#FF0000` border, bold Comic Sans MS 13/20 `#FFFF00`, scrolls right to left, 18 s per loop |
| "NEW!" burst | after two titles (see above), 6 px gap | `assets/badge_new.svg` 40 × 20, blinks (1 s, steps) |
| "Oh, snap!" note | broken layout: right of the table, 36 px out, 40 px below the header top (x ≈ 676, y ≈ 120). Fixed layout: over the photo's top-right corner (−12 px top, −28 px right) | 184 px wide, padding 10 × 12, `#FFFF99`, 1 px `#CC9900`, hard shadow `3px 3px 0 #000`, Comic Sans MS 13/17 black, rotated 2.5°; "Oh, snap!" 18/24 `#CC0000` on its own line. Leaves with the images it complains about (step 3). |
| Footer | bottom of the table, 20 px above, `<hr>` groove on top, centred, Verdana 11/16 | `assets/sign_under_construction.svg` (208 × 40) · "You are visitor number" + counter (6 digits, each 12 px black cell, bold Courier New 14 `#33FF33`, 1 px gaps on `#404040`) · badges `badge_800x600.svg`, `badge_guestbook.svg` (88 × 31, 6 px apart) · webring line · last-updated line |

## Terminal chat panel

**Style: a Windows 98 window with an IRC log in a black terminal.** Why: chat semantics (nicks, joins, timestamps) are instantly readable as "people talking", the black terminal says "an agent at work", and the Win98 frame dates it to the page's era, so the dock and the page read as one 2002 desktop. Green phosphor for the agent, amber for the visitor: two colours that never get confused and both clear AA on black.

- **Window** (`.win`): `--retro-win-face` `#C0C0C0`, 3 px padding, Win98 bevel (inset 1 px `#0A0A0A`/`#FFFFFF`, 2 px `#808080`/`#DFDFDF`) plus a hard `4px 4px 0 rgba(0,0,0,.35)` shadow. Font: `--retro-win-font` (Tahoma → Verdana on macOS) 11 px, black.
- **Title bar**: 18 px, `--retro-win-title` gradient `#000080 → #1084D0`, white bold 11 px, 3 px left padding. 14 px icon (speech bubble `#FFFF99` with black outline, inline SVG in the mock), title `#andrew-cv - agent chat`, then one 16 × 14 bevelled button `_` (minimise, see Behaviour). No close button (no skip in scope).
- **Log** (`role="log"`, `aria-live="polite"`): sunken black field (`--retro-term-bg`), 2 px under the title, padding 6 × 8, `--retro-term-font` IBM Plex Mono 13/18, wraps anywhere, hanging indent 7ch so text lines up after the timestamp. Messages 4 px apart. Follows the last line; older lines scroll off the top (the visitor can scroll back).
  - System: `[20:14] *** Now talking in #andrew-cv` all `--retro-term-dim` `#808080`.
  - Agent: `[20:14]` dim · `<agent>` weight 600 · text, all `--retro-chat-agent` `#33FF66`.
  - Visitor: `[20:14]` dim · `<you>` weight 600 · text, all `--retro-chat-visitor` `#FFB000`.
  - Time = the visitor's local `HH:MM`.
  - Agent replies stream in as typing (40 chars/s, or as tokens arrive).
- **Input** (composer): separate sunken black field, 2 px below the log, padding 5 × 8, same mono 13/18. Prompt `you>` amber, 1ch gap, typed text amber, block caret (1ch × 1.1em, current colour, blinks 1 s). Empty: caret then placeholder `type here, press Enter` in dim grey. Enter sends; empty input does nothing; max 500 characters as the existing `/api/chat` contract.
- **Status bar**: 2 px below, three sunken cells: `● connected` (flex), `2 users`, `EN`.

## Live-fix console

- Same window chrome. Title: terminal icon (black screen, green `>_`), `fix.exe - live console`, `_` button.
- **Screen**: sunken black field, padding 6 × 8, IBM Plex Mono **12/17** (`--retro-code-font-size`/`-line-height`: code lines are longer than chat lines and the widest path, `--- src/screens/cv/TechnologiesSection.module.css`, must fit 368 px), hanging indent 2ch. Top-anchored, follows the last line once full.
- **Line kinds** (colours are proposed tokens):

| Kind | Example | Look |
|---|---|---|
| prompt | `$ agent fix --live andrew-cv` | white |
| step comment | `# 1/7 fonts & colours: Verdana 11px -> Inter 15px, navy on white` | dim `#808080` |
| file | `--- src/theme/tokens.css` | white, weight 600 |
| context | `:root {` | 2ch gutter, syntax colours |
| removed | `-  --font-body-size: 11px;` | whole line `--retro-code-del` `#FF5555` on `--retro-code-del-bg` (10 % red), no syntax colours |
| added | `+  --font-body-size: 15px;` | `+` in `--retro-code-add` `#55FF55`, line on `--retro-code-add-bg` (10 % green), syntax colours |
| applied | `✓ fonts applied` | `#55FF55`, indented 2ch |
| finished step | `✓ 1/7 fonts & colours` | `#55FF55` |

  Syntax (CSS): selectors `--retro-code-selector` `#55FFFF`, properties `--retro-code-property` `#FFFF55`, strings `--retro-code-string` `#55FF55`, numbers, colours and `@import` `--retro-code-number` `#FF55FF`, the rest `--retro-term-text` `#C0C0C0` (the VGA palette). TSX lines (step 6) use the same roles: tags as selectors, attributes as properties.
- **Caret**: block, `#C0C0C0`, at the end of the line being typed; blinks only while idle.
- **Progress row** under the screen: label 158 px (`Step 2 of 7: layout`, ellipsis), a sunken bar filled with `--retro-progress` `#000080` blocks (8 px block, 2 px gap), percentage right-aligned in 32 px. At the end: `All fixes applied`, 100 %.

## POC steps (round 1)

### Step 1: fonts & colours (layers `fonts`, `colours`)

Before: `03-console.png` · mid: `04-step1-mid.png` · after: `05-after-step1.png`.

```
# 1/7 fonts & colours: Verdana 11px -> Inter 15px, navy on white
--- src/theme/global.css
+ @import '@fontsource/inter/latin-400.css';
+ @import '@fontsource/inter/latin-500.css';
- h1, h2, h3 { font-family: 'Times New Roman', serif; }
--- src/theme/tokens.css
  :root {
-   --font-family: Verdana, Geneva, sans-serif;
+   --font-family: 'Inter', system-ui, sans-serif;
-   --font-body-size: 11px;
+   --font-body-size: 15px;
+   --font-section-size: 21px;
  ✓ fonts applied                      <- hunk 1 done: layer `fonts` removed
-   --color-bg: #ffffcc;
+   --color-bg: #ffffff;
-   --color-text: #000000;
+   --color-text: #001670;
-   --color-text-secondary: #008000;
+   --color-text-secondary: #445598;
--- src/theme/global.css
  body {
-   background: #000033 url('stars.gif');
+   background: var(--color-bg);
  ✓ colours applied                    <- hunk 2 done: layer `colours` removed
✓ 1/7 fonts & colours
```

After step 1 the page is Inter in navy on white; still a 640 px table on the left with a bevel frame, nav bar, marquee, `<hr>`s, bullets, broken images, inset cells, blue links and the note on the (now white) margin.
Chat: *"Fonts and colours are from this decade now. Easier on the eyes?"*

### Step 2: layout (layer `layout`)

Before: `05-after-step1.png` · mid: `06-step2-mid.png` · after: `07-after-step2.png`.

```
# 2/7 layout: 640px table on the left -> centred 672px column
--- src/app/App.module.css
  .shell {
-   width: 640px;
-   border: 3px outset #c0c0c0;
+   max-width: calc(var(--content-max-width) + 2 * var(--page-gutter));
+   margin: 0 auto;
--- src/screens/cv/HeaderSection.module.css
  .root {
-   text-align: center;
+   display: grid;
+   grid-template-columns: 1fr auto;
--- src/screens/cv/TechnologiesSection.module.css
  .grid {
-   column-gap: 2px;
+   column-gap: var(--space-7);
  ✓ layout applied                     <- one hunk group: layer `layout` removed at the end
✓ 2/7 layout
```

After step 2: centred column; header with the photo box on the right and contacts under it; 3 technology columns 30 px apart; experience heads as grid rows with dates on the right; apps in a row; the note sits on the photo's corner. Still: nav bar, marquee, `<hr>`s, bullets, broken and squashed images, inset cells, blue links.
Chat: *"Centred on a proper grid. Next up: the pictures that never loaded."*

Step 2 is one hunk group applied at the end (a half-moved layout looks like a bug, not a fix). The shown excerpts must be the real lines of those files; which lines the scenario shows is an authoring choice, the diff above is the proposal.

## Full ordered fix list

| # | Name (console / progress) | Removes layer | What changes on the page | Code the console shows (files) | Chat line (fallback) |
|---|---|---|---|---|---|
| 1 | fonts & colours | `fonts`, `colours` | Inter and today's type scale; navy on white; star tile gone | `global.css` (@fontsource imports, heading family), `tokens.css` (font and colour tokens), `global.css` (body background) | Fonts and colours are from this decade now. Easier on the eyes? |
| 2 | layout | `layout` | centred 672 px column, header grid, 3-column tech grid, experience grid, apps row | `App.module.css`, `HeaderSection.module.css`, `TechnologiesSection.module.css` (+ `ExperienceEntry`, `AppsSection` in later rounds) | Centred on a proper grid. Next up: the pictures that never loaded. |
| 3 | images | `images` | photo, Transcenda logo, Savant icon, Siddhartha cover load; logos stop squashing; photo becomes a circle; "Oh, snap!" note leaves | `images.ts` (`- const photo = '/images/photo.jpg'` → `+ import photo from './assets/cv_photo.jpg'`), `HeaderSection.module.css` (`border-radius: 50%; object-fit: cover`), `ExperienceEntry.module.css` (`object-fit: contain`) | All pictures found. They were in the wrong folder since 2002. |
| 4 | cards | `cards` | technology cells become cards (green border, radius 12, shadow), highlight star, AI gradient border; app cards; logo radius; book shadows | `tokens.css` (`--radius-card`, `--shadow-card`), `TechnologyCardView.module.css` (card, `.highlighted`, `.ai::before` mask), `AppCardView.module.css`, `BookView.module.css` | Tables are for data. These are cards now. |
| 5 | spacing & lists | `rhythm` | `<hr>`s gone, bullets gone, section spacing 36/12, entries 30 apart | `SectionTitle.module.css` (margins), `SectionTitle.tsx` (`- <hr />`), `ExperienceEntry.module.css` (`list-style: none`, gaps) | Gave everything room to breathe and retired the `<hr>`s. |
| 6 | 2002 chrome | `chrome` | nav bar, marquee, "NEW!" bursts, construction sign, counter, badges, webring, last-updated line gone | `CvScreen.tsx`: `- <marquee>…</marquee>`, `- <NavBar />`, `- <HitCounter />`, `- <Blink>NEW!</Blink>`, `- <UnderConstruction />` | Said goodbye to the marquee and the hit counter. You were visitor 004271, by the way. |
| 7 | links & contacts | `links` | links in text colour, underline on hover only; contact icons back, text labels gone | `ContactList.module.css` (`color: inherit; text-decoration: none`, `:hover` underline), `ContactList.tsx` (icons) | Done. This is Andrew's CV as it looks today. Ask me anything about his experience. |

After step 7 no damage layer is left and the page must match today's site pixel for pixel (the real CSS, not a copy).

## Proposed tokens (`retro-` prefix; Theme or the show's own CSS adds them, not this package)

| Token | Value | Use |
|---|---|---|
| `--retro-dock-width` | `384px` | dock width |
| `--retro-dock-inset` | `16px` | dock distance from the viewport edges |
| `--retro-dock-gap` | `12px` | gap between console and chat |
| `--retro-chat-height` | `344px` | chat window height |
| `--retro-win-face` | `#C0C0C0` | window face, buttons, progress track |
| `--retro-win-light` | `#FFFFFF` | bevel highlight |
| `--retro-win-shadow` | `#808080` | bevel shadow |
| `--retro-win-dark` | `#0A0A0A` | bevel outer dark |
| `--retro-win-title` | `linear-gradient(90deg, #000080, #1084D0)` | title bars |
| `--retro-win-title-text` | `#FFFFFF` | title text |
| `--retro-win-font` | `Tahoma, Verdana, 'Segoe UI', sans-serif` | window chrome |
| `--retro-win-font-size` | `11px` | window chrome (title, status, progress label) |
| `--retro-term-bg` | `#000000` | terminal fields |
| `--retro-term-font` | `'IBM Plex Mono', 'Courier New', monospace` | chat and console (IBM Plex Mono, OFL, self-hosted via `@fontsource/ibm-plex-mono` 400 + 600) |
| `--retro-term-font-size` / `--retro-term-line-height` | `13px` / `18px` | chat log and input |
| `--retro-code-font-size` / `--retro-code-line-height` | `12px` / `17px` | console |
| `--retro-term-text` | `#C0C0C0` | console default text, caret |
| `--retro-term-dim` | `#808080` | timestamps, system lines, step comments, placeholder |
| `--retro-chat-agent` | `#33FF66` | agent messages |
| `--retro-chat-visitor` | `#FFB000` | visitor messages, input |
| `--retro-code-selector` | `#55FFFF` | selectors, tags |
| `--retro-code-property` | `#FFFF55` | properties, attributes |
| `--retro-code-string` | `#55FF55` | strings |
| `--retro-code-number` | `#FF55FF` | numbers, colours, at-rules |
| `--retro-code-add` / `--retro-code-add-bg` | `#55FF55` / `rgba(85,255,85,.1)` | added lines, ✓ lines |
| `--retro-code-del` / `--retro-code-del-bg` | `#FF5555` / `rgba(255,85,85,.1)` | removed lines |
| `--retro-progress` | `#000080` | progress blocks |
| `--retro-z-index` | `1000` | dock (same level as `--chat-z-index`; the chat FAB is absent during the show) |

Timing (for the scenario, not CSS): chat appears at 3 s; typing 40 chars/s (prose) and 60 chars/s (code); 800 ms after a step; 1.5 s between steps.

## Texts (EN only, verbatim)

**Page furniture** (damage layer `chrome` unless noted):
- Nav: `Home` · `Resume` · `My Apps` · `Books` · `Guestbook` · `Links`
- Marquee: `*** Welcome to my homepage! *** Senior Android Engineer *** Creating Android apps since 2012 *** Please sign my guestbook! ***`
- Burst: `NEW!` (alt `New`)
- Note (layer `images`): `Oh, snap!` / `Some pictures didn't load. Try pressing F5... or just wait a minute.`
- Contact labels (layer `links`): `E-mail me:` · `Phone:`
- Broken images show their file name as alt text: `photo.jpg`, `logo_transcenda.png`, `app_savant.png`, `book_siddhartha.jpg`
- Footer: `UNDER CONSTRUCTION` (in the SVG; alt `Under construction`) · `You are visitor number 004271` · badge alts `Best viewed at 800x600`, `Sign my guestbook` · `[ << Prev | Android Devs Webring | Next >> ]` · `Last updated: 14.03.2002 · © 2002 Andrew Panasiuk. All rights reserved.`
- Browser tab title during the show: `Andrew Panasiuk - Homepage` (today's title comes back after step 7).

**Chat:**
- Window title: `#andrew-cv - agent chat` · status `● connected` · `2 users` · `EN` · minimise `_` (aria-label `Minimise`)
- System: `*** Now talking in #andrew-cv` · `*** agent has joined`
- Opening (scripted, not LLM): `Oops... looks like this site got stuck in 2002 and is a bit broken. Tell me what you think while I fix it.`
- Console hand-off (scripted): `Opening my console. Watch the page: every line I type lands on it right away.`
- Per-step lines: the table above (LLM may rephrase; these are the fallbacks and the tone reference: short, dry, friendly, never mocking the visitor or Andrew).
- Closing (scripted): `Done. This is Andrew's CV as it looks today. Ask me anything about his experience.`
- Placeholder: `type here, press Enter` · prompt `you>` · nicks `<agent>`, `<you>`
- Errors (system style, dim): LLM failed `*** agent lost the connection for a moment. Try again?` · rate-limited `*** agent needs a minute to catch up. Try again soon.` · over 500 characters `*** message too long (500 characters max)` · offline `*** you're offline. The fixes keep going; chat comes back when you do.`
- Example exchange in the renders (not scripted): visitor `wow, a marquee! haven't seen one in 20 years` → agent `Enjoy it while it lasts. It's on my list, near the end.`; `much better already` → `Thanks! Layout is next: it has been leaning left since 2002.`

**Console:**
- Window title `fix.exe - live console` · prompt `$ agent fix --live andrew-cv`
- Step comments: `# n/7 <name>: <what, one line>` (steps 1–2 above; later steps written with them)
- `✓ <hunk> applied` · `✓ n/7 <name>` · end: `$ ` then `all 7 fixes applied. Welcome to 2026.`
- Progress: `Step n of 7: <name>` · `All fixes applied` · `<n>%`
- Step names: `fonts & colours`, `layout`, `images`, `cards`, `spacing & lists`, `2002 chrome`, `links & contacts`

## Assets

All made for this package (GRA-38), hand-written SVG, **CC0**: no third-party art, logos or trademarks (no browser logos on the badges).

| File | Size | What |
|---|---|---|
| `assets/retro_tile_stars.svg` | 64 × 64, tiles | navy night sky, white dots and yellow pixel crosses |
| `assets/icon_broken_image.svg` | 16 × 16 | "image failed" icon: page with folded corner, red ×, two colour blocks |
| `assets/sign_under_construction.svg` | 208 × 40 | yellow/black stripes, pixel digger, `UNDER CONSTRUCTION` (Arial Black; outline the text to a path if exact rendering matters) |
| `assets/badge_800x600.svg` | 88 × 31 | grey bevel badge with a monitor, `best viewed` / `800×600` |
| `assets/badge_guestbook.svg` | 88 × 31 | cream badge with a book, `SIGN MY` / `GUESTBOOK` |
| `assets/badge_new.svg` | 40 × 20 | red starburst `NEW!` |

CV images come from `docs/design/cv/assets/` (the app's `src/screens/cv/assets/`); broken images are the same files **not loading** (a wrong path), so step 3 is a genuine path fix.

Fonts: Inter (already shipped), IBM Plex Mono (OFL, new, for the dock). The retro faces are system fonts and are **not** shipped: Comic Sans MS may not be redistributed; fallbacks `'Comic Neue'` (OFL, only if the orchestrator wants Linux parity) then `cursive`; Verdana → `Geneva, sans-serif`; Times New Roman → `Times, serif`.

## States and behaviour

- **Page links during the show**: nav buttons and webring links are dead (`href="#"`, no navigation); contacts work as today (mail, phone).
- **Minimise `_`** (both windows): collapses the window to its title bar (18 px + frame), the other window takes the space; clicking the title bar restores. The show keeps running while minimised. This is the only control on the windows.
- **Visitor scrolls**: the page scrolls, the dock stays. The agent does not scroll the page in round 1. Later steps that fix things below the fold (3–6) may scroll the target into view and flash it with the existing `--agent-highlight-*` tokens (from the page agent); that's for the round that builds them.
- **Visitor types during a step**: the message is logged at once; the agent's reply streams in the chat; the console does not pause.
- **Reload during the show**: out of scope (replay/skip is out). Default: the show starts over.
- **Loading**: the broken page must be visible at first paint (no flash of today's design, then the break): the damage is applied before the first render.
- **Errors**: if the chat backend is unavailable, the chat still opens with the scripted lines and the console still runs; visitor messages get the error lines above.
- **Accessibility**: chat log `role="log"` `aria-live="polite"`; console `role="log"` with `aria-live="off"` and `aria-label="Live fix console"` (typing would flood a screen reader), plus a visually hidden live line announcing each finished step (`Step 1 of 7 done: fonts & colours`); progress `role="progressbar"` with `aria-valuenow`. Input has a label (`Message the agent`, visually hidden). Focus is never moved by the show. Contrast: all chat and console colours on black ≥ 5.3:1 (`#808080` 5.3, `#FF5555` 6.7, `#33FF66` 15.6, `#FFB000` 11.5); retro page pairs `#CC0000` 5.7, `#008000` 5.0, `#0000EE` 9.1, `#800080` 9.2 on `#FFFFCC`. Two known misses, both short-lived: the retro "remotely" tag `#808080` on `#FFFFCC` is 3.8:1 (gone after step 1), and white title text on the light end of the title gradient is 4.0:1 (titles are short and sit on the navy end). 11 px Verdana body is deliberately small and lasts one step. Reduced motion: see Timeline.

## Data

- CV content: unchanged, from `CvRepository` (`cv.en.json`).
- Show scenario (authored, not LLM): ordered steps, each with name, comment line, hunks (file, lines, the damage layer it removes), chat fallback line. Shape is GRA-39's call; the table above is the content.
- Which images are "broken" (photo, Transcenda logo, Savant icon, Siddhartha cover) and which are "squashed" (all other logos) is scenario data.
- Visitor messages → analytics and the LLM (project decision). The hit counter number is fixed text (`004271`), not a real count.

## Mock vs the real site

| Mock | Real site |
|---|---|
| Top padding 64 px, no language switcher | `.shell` 16 px + switcher row + 36 px |
| Inter and IBM Plex Mono from Google Fonts | self-hosted `@fontsource` |
| Retro elements are extra markup hidden by CSS | the implementation decides (GRA-39) how furniture enters and leaves the DOM |
| Damage as `html[data-dmg~=…]` selectors | same idea proposed; mechanism is GRA-39's |

## Decisions (defaults taken; the orchestrator may change them)

1. **Direction**: 2002 FrontPage/GeoCities homepage (one era, one look), not a 1996–2006 collage.
2. **Chat and console look**: Win98 windows with black terminals (IRC log in the chat, diff in the console), not a bare green-on-black full terminal. Same era as the page; clearer structure (title, minimise, status).
3. **The windows stay retro after the fix.** They are the agent's tools, not part of the site; restyling them would be an eighth step if wanted.
4. **7 steps**, in the order above; steps 1–2 as the brief suggested. Step 1 includes the type *sizes* with the family (they are tokens in the same `:root` edit, and 11 px Inter after step 1 would look like a regression).
5. **Code is shown as diffs** of real project files (`-`/`+`), because a token edit reads best as "old value → new value".
6. **A layer is removed when its hunk is fully typed**, never mid-line; step 2 is one hunk group applied at the end.
7. **Dock reserves its width** (the page lays out in viewport − 416 px) instead of overlapping the page; the page centres in the remaining area.
8. **No language switcher and no chat FAB during the show**; the terminal chat is the chat. What happens after step 7 (FAB comes back? switcher?) is left open: default, nothing changes, the terminal chat stays.
9. **Opening, hand-off and closing chat lines are scripted**; per-step lines are LLM with scripted fallbacks.
10. **Minimise** is the only window control; no close (no skip in scope).
11. **Broken images**: 4 (photo, Transcenda, Savant, Siddhartha); the rest squashed. Enough to read as broken without hiding the CV.
12. **Jokes stay in the furniture**; CV text is never altered or mocked.
