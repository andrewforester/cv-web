# Retro Rebuild show (web) — design package

The look of the show. The mechanism (damage layers, decorations, runner, LLM, shell) is `docs/retro/ARCHITECTURE.md` (GRA-39, as built: §9); this package follows its model and vocabulary and only adds what it leaves to the design: retro values, layer contents, copy, the panels, timing and motion, the fix list.

**Revision GRA-49 (30 Sep 2026)**, from the human's notes on the POC: the agent fixes the page in **atomic chunks** (one visible change each: a short code chunk typed, applied right after its last character, then a beat), page changes **transition smoothly**, the visitor **sees what changed** (a highlight on the target, scrolling to it), and the windows **close smoothly** at the end. The fonts stay as they are (the terminal font included). Sections changed by it: Source, Timeline, Damage layers, Terminal chat (font), Live-fix console, The fix list (atomic), Chunk rhythm and timing budget, Transitions, Show what changed, End of the show, tokens, texts, Decisions 12–22.

## Source

- Designed from the brief of Linear **GRA-38** and the project *Retro Rebuild* (30 Sep 2026); revised by **GRA-49**. **No screenshot or Figma frame exists.** The end state is today's design unchanged (`docs/design/cv/SPEC.md`, `src/theme/tokens.css`); the retro look comes from 1998–2006 references (below).
- `layers/*.css`: the **damage layers, one per chunk** (32 files), ready to copy into `src/screens/retro/layers/` (they replace the 12 round-1 files there). They select only the architecture's hook contract (`[data-retro-stage]`, `data-testid`, `data-agent-id`, element types) and redefine only existing token names. They are the "old code" the console types, so they are written to read well, and they are Prettier-formatted as they will be in `src/`.
- `mock.html`: a static mock. It renders today's CV with the **same element types and hooks** as `src/screens/cv` (styled by the real `src/theme/tokens.css` plus approximations of the CSS Modules), injects `layers/*.css` as `<link data-retro-layer>` at the end of `<head>`, draws the decorations and the target highlight in a portal, and generates the console text from the layer files and the live `tokens.css` values, as the runner does. Query params: `?state=broken|chat|console|step1-mid|step1|colours-mid|step2-mid|step2|rest-mid|end`, `&dock=0`. It reads files with XHR, so open it over http (`python3 -m http.server` in the repo root → `/docs/design/retro/mock.html`) or use `render.sh`. It shows moments, not motion: transitions are described below, not mocked.
- Renders are 1× (CSS px = image px), made by `render.sh` (headless Chrome, reduced motion, so marquee and carets hold still). **Render on macOS or Windows:** the retro faces (Verdana, Times New Roman, Comic Sans MS, Arial) are the "core fonts for the web", and Linux substitutes them.

| File | Viewport | Shows |
|---|---|---|
| `01-broken.png` | 1280 × 800 | t = 0: the broken 2002 page alone |
| `02-chat.png` | 1280 × 800 | page + terminal chat (greeting, one exchange, visitor typing) |
| `03-console.png` | 1280 × 800 | console open, chunk 1 (`type-faces`) typing: `// → headings`, the headings carry the target highlight |
| `04-step1-mid.png` | 1280 × 800 | fonts step mid-way: faces, family and heading sizes applied, `type-scale-text` typing, highlight on the summary |
| `05-after-step1.png` | 1280 × 800 | after *fonts* and *colours* (= the POC's step 1): Inter, navy on white, still the 640 px table |
| `06-step2-mid.png` | 1280 × 800 | **beat after a chunk**: `header-layout` just applied (`✓ header-layout removed`), the header's highlight with the fill flash |
| `07-after-step2.png` | 1280 × 800 | after *layout* |
| `08-rest-mid.png` | 1280 × 800 | beat after `tech-cells`: every card in view highlighted |
| `09-end.png` | 1280 × 800 | finale: no damage left, switcher back, console 100 %; the windows close 3 s later |
| `10-colours-mid.png` | 1280 × 800 | beat after a **page-wide** chunk (`base-colors`): the frame around the page area |
| `full-broken.png`, `full-after-step2.png` | 1280 × 3000 | whole page without the dock |

`09-end.png` approximates today's site; the real site is the reference for the end state.

## References and direction

Real pages and collections from about 1996–2006, checked 30 Sep 2026:

| # | Reference | What we borrow |
|---|---|---|
| 1 | [Space Jam (1996), spacejam.com/1996](https://www.spacejam.com/1996/) | Tiled star-field background: the "space" homepage tile. |
| 2 | [GeoCities special collection, Internet Archive](https://archive.org/web/geocities.php) | The whole genre: fixed-width table page on a tiled background. |
| 3 | [OoCities, the GeoCities mirror](https://www.oocities.org/) | Real personal homepages as they were left in 2009. |
| 4 | [Resume of a Lotus Notes developer, oocities](https://www.oocities.org/siliconvalley/vista/4059/resume.html) | A developer CV as a homepage: `<hr>` between sections, bold headings, a link row. |
| 5 | [Resume of Gagan Bindra, oocities](https://www.oocities.org/gaganbindra/resume.htm) | A row of GIF nav buttons (Home, Resume, Projects, My Photos) over a CV: our bevelled nav bar. |
| 6 | [Cameron's World](https://www.cameronsworld.net/) | Collage of GeoCities GIFs: "NEW!" bursts, counters, construction signs, guestbook badges. |
| 7 | [GifCities, Internet Archive](https://gifcities.org/) | The GIF vocabulary. We draw our own; nothing is copied. |
| 8 | ["This Page Is Under Construction", textfiles.com (Jason Scott)](http://www.textfiles.com/underconstruction/) and [the Archive Team write-up](https://ascii.textfiles.com/archives/2236) | The yellow and black construction sign with a little digger. |
| 9 | [Web counter, Wikipedia](https://en.wikipedia.org/wiki/Web_counter) | The odometer hit counter. |
| 10 | [Web badge, Wikipedia](https://en.wikipedia.org/wiki/Web_badge) | 88 × 31 buttons: "best viewed at 800×600", "sign my guestbook". |
| 11 | [Microsoft FrontPage in 1996, Web Design Museum](https://www.webdesignmuseum.org/gallery/microsoft-frontpage-1996) | The WYSIWYG-editor look: centred headings, bevelled buttons, default blue underlined links. |
| 12 | [Golden Age of Web Design 2000–2005](https://www.webdesignmuseum.org/golden-age-of-web-design) and [00s styles](https://www.webdesignmuseum.org/styles/00s), Web Design Museum | Era check: Verdana 10–11 px body, Times headings, 640–760 px fixed tables. |
| 13 | [98.css (Jordan Scales, MIT)](https://jdan.github.io/98.css/) | Reference for the Windows 98 window chrome of the panels (bevel colours, title gradient). Not imported; the chrome is a few lines of CSS. |
| 14 | MS Paint's rectangle selection (Windows 95–XP) | The dashed "selection" line of the target highlight (GRA-49). |

**Direction: "a 2002 personal homepage, made in FrontPage, hosted on GeoCities".** One coherent page, not a collage: a fixed 640 px table hard against the left edge on a star tile; Verdana 11 px body, Times New Roman headings in red, a purple name; a bevelled nav bar, a Comic Sans marquee, blinking "NEW!" bursts, an `<hr>` under every heading, default blue underlined links; images that don't load; a footer with a construction sign, hit counter, badges and a webring. The CV text stays exactly the same (a job-seeker's CV: the jokes are in the furniture, never in the content). The agent's tools are **Windows 98 windows with terminals inside**: same era as the page, so the screen reads as one 2002 desktop, while the agent's code is clearly 2026. The agent's pointer on the page (the highlight) borrows the Paint selection in the terminal's green: it belongs to the agent, not to either era of the page.

## Screen layout during the show (1280 × 800, desktop only)

```
x: 0                                                   880        1264 1280
   ┌─ page area (viewport − 416 px) ─────────────────┐  ┌─ dock ───────┐
   │ broken: 640 px table at x = 8                   │  │ console       │  y 16
   │ fixed:  672 px column centred in the page area  │  │ (fills)       │
   │                                                 │  ├───────────────┤  gap 12
   │                                                 │  │ chat  344 px  │
   └─────────────────────────────────────────────────┘  └───────────────┘  y 784
```

- **Dock** (rendered by the retro screen through its portal): `position: fixed`, `top`/`right`/`bottom` 16 px (`--retro-dock-inset`), width 384 px (`--retro-dock-width`), a column anchored to the bottom with a 12 px gap (`--retro-dock-gap`). Chat: 344 px tall (`--retro-chat-height`). Console: the rest (≈ 412 px at 800 px tall). Before the console exists, the chat sits alone at the bottom.
- **Page area**: while the dock is shown, `body` gets `padding-right: calc(var(--retro-dock-width) + 2 * var(--retro-dock-inset))` (416 px): show styling, not a damage layer. The page lays out in 864 px and the dock never covers content. The broken page is left-aligned, so reserving the space when the chat appears moves nothing. After `page-frame` the column centres in the 864 px (x ≈ 96–768). When the windows close at the end, the reserve goes and the page re-centres in the full viewport (End of the show).
- The page scrolls under the fixed dock. The show scrolls it to a chunk's target when the target is out of view (Show what changed → Scrolling).
- **Highlight overlay** (GRA-49): show-owned, drawn in the portal over the page and under the dock; never covers the windows.
- **During the show there's no AI chat button and no language switcher** (the switcher's app header is hidden by the `hide-header` layer). Both come back through fix chunks.

## Timeline

Timings are the runner's (`timing.ts`); the design values:

| t | What happens |
|---|---|
| 0 s | Page alone, fully broken. Marquee scrolls (18 s loop), "NEW!" bursts blink (1 s steps). |
| 3 s | Chat window appears (instant, like a Win98 window). Two system lines at once, then the greeting types at 40 chars/s (≈ 3 s). The input works from now on; focus is **not** moved into it. |
| greeting + 2 s | Agent (scripted): "Opening my console…". The console window appears above the chat and prints the prompt line. |
| then | **8 steps of atomic chunks** (The fix list). Each step: **narrate** (its chat line starts typing; 0.6 s later the first chunk starts) → **chunk** → **chunk** → … → 0.3 s → `✓ n/8 <title>`. Each chunk: **target** (highlight appears, scroll if needed) → **type** (≤ 1.3 s) → **apply** at its last character (`✓ <id> removed`, the change transitions in) → **beat** 1 s. When the next step starts, the finished step's code collapses into its `✓ n/8 <title>` line. |
| end | Finale line in the chat; console shows every step ✓ and 100 %. **3 s later both windows close with a short animation** (0.65 s) while the page re-centres; the page is the real site, AI chat button included. |

**Total at normal motion ≈ 92 s** (Chunk rhythm and timing budget).

**Progress**: `(finished steps + share of the current step's chunks applied) / 8`, a Win98 block bar with `Step n of 8: <title>` and the percentage.

**`prefers-reduced-motion`** (ARCHITECTURE Q4): each chunk's code appears at once and applies 0.6 s later, then the 1 s beat; no transitions, no view transitions, no smooth scroll (jumps), the highlight appears and disappears without fading; windows close instantly; marquee static (text starts at the left); no blinking (bursts and carets stay visible); chat lines appear whole. ≈ 70 s.

## The broken page

### Damage layers (`layers/*.css`)

Each layer is one file and one chunk: the fix list below says what each holds, in show order. Token layers (`:root`) only redefine names in `src/theme/tokens.css` and print as `-`/`+` diffs; rule layers only use hooks and print verbatim. Retro literals are allowed in layer files (ARCHITECTURE Q5).

Round 1 → GRA-49 split (old file → new files, same retro values unless noted):

| Round 1 | GRA-49 |
|---|---|
| `tokens-type` | `type-family`, `type-scale-headings`, `type-scale-text`, `type-scale-cards`, `type-scale-details` |
| `tokens-colors` | `base-colors` (bg, text, secondary, muted), `card-colors` (card border, highlight, app accent, app border); `--color-app-text` dropped (`#202124` → `#000000` wasn't visible) |
| `type-faces` | `type-faces` (unchanged) |
| `page-colors` | `page-background` (tile + cream table), `heading-colors` (name, section titles), `tech-fills` (cell colours); the app card fill moved into `app-cells` |
| `layout-shift` | `page-frame`, `header-layout`, `tech-grid`, `experience-heads`, `app-stack`; the books' 12 px gap moved into `about-spacing` |
| `broken-images` | `broken-photo`, `squashed-logos`, `broken-icon`, `broken-cover`. **Transcenda's logo is now squashed like the other logos**, not broken (3 broken images instead of 4) |
| `table-cells` | `tech-cells` (with the hidden star and AI gradient), `app-cells` (with the app fill and square icons), `book-frames`; experience logos' radius comes from `squashed-logos` |
| `old-rhythm` | `heading-rules`, `bullets`, `experience-rhythm`, `about-spacing` (with the About subtitles) |
| `new-bursts` | `new-bursts`: 40 × 20 box by padding; `@keyframes retro-blink` comes from the layer host (defined only when motion is allowed), not from the file |
| `decor-room`, `hide-header` | unchanged |
| `old-links` | `link-style` (link colour, hidden icons), `contact-labels` (`E-mail me:`, `Phone:`) |

With every layer on, the page is the round-1 broken page except for Transcenda's logo (squashed instead of broken). No two layers set the same property on the same element, so the cascade doesn't depend on the order layers are removed.

Hooks used beyond the list in ARCHITECTURE → Hook contract: `address`, `figure`, `div` **only through `:has(…)` on a hook** (e.g. `div:has(> [data-testid='cv-technology-card'])` for the technology column), `:not()`, `::before`/`::after`. No Module classes, no `:nth-child`. The hook test (guard 2) covers them.

Host variables (set by the layer host from bundled assets): `--retro-broken-image` → `assets/icon_broken_image.svg`, `--retro-tile-stars` → `assets/retro_tile_stars.svg`, `--retro-badge-new` → `assets/badge_new.svg`. The host also defines `@keyframes retro-blink { 50% { visibility: hidden; } }` unless reduced motion is on.

### Decorations (show-owned DOM, portal, `aria-hidden`)

| Id | Anchor | Look | Removed by |
|---|---|---|---|
| `top-bar` | top-left of `[data-testid='cv']`, its full width (inside the `decor-room` top padding) | **Nav**: `#000080` strip, 3 px padding, 8 px below; centred buttons `Home` `Resume` `My Apps` `Books` `Guestbook` `Links`: `#C0C0C0`, `2px outset #FFF`, padding 2 × 10, bold Verdana 11/14, black, underlined; not links. **Marquee**: black strip, 1 px `#FF0000` border, bold Comic Sans MS 13/20 `#FFFF00`, right to left, 18 s loop | chunk 29 |
| `page-footer` | bottom of `[data-testid='cv']`, its full width, top edge 200 px above the bottom (inside the `decor-room` bottom padding) | 2 px groove rule on top, 8 px padding, centred, Verdana 11/16 black: `sign_under_construction.svg` (208 × 40) · "You are visitor number" + counter (6 digits, each a 12 px black cell, bold Courier New 14/18 `#33FF33`, 1 px gaps on `#404040`) · badges `badge_800x600.svg` and `badge_guestbook.svg` (88 × 31, 6 px apart) · webring line (underlined `#0000EE`, not links) · last-updated line | chunk 31 |
| `oh-snap` | while `page-frame` is on: 28 px right of `main`, 40 px below the header top (x ≈ 676, y ≈ 128); after: over the photo's top-right corner (right edge 28 px past the photo, top 12 px above it), following the photo when `header-layout` moves it | 184 px wide, padding 10 × 12, `#FFFF99`, 1 px `#CC9900`, hard shadow `3px 3px 0 #000`, Comic Sans MS 13/17 black, rotated 2.5°; `Oh, snap!` 18/24 `#CC0000` on its own line. It sits in the margin, never over CV text, and leaves right after the photo loads | chunk 17 |

**Leaving** (GRA-49): a removed decoration fades out and shrinks to 96 % over 250 ms (`--retro-leave-duration`, `--retro-close-easing`), then unmounts; reduced motion: at once.

The alt text of a broken image isn't shown (CSS can't read it; ARCHITECTURE → Broken images). The icon and the empty box are enough.

### Per section: what the visitor sees

| Section | Broken (all layers) |
|---|---|
| Frame | star tile; a cream 640 px table with an outset grey border at x = 8, y = 8; nav bar and marquee at its top |
| Header | broken photo box (120 × 120) on the left; purple Times name, Verdana headline and italic tagline centred beside it; `E-mail me: …  Phone: …` centred below in blue underlined links, no icons |
| Summary | red Times title with a groove rule; six disc bullets, Verdana 11 |
| Technologies | centred red title; 3 columns of bevelled cells (cyan, one yellow, one pink), 2 px apart; "NEW!" after *AI Tools* |
| Latest relevant experience | "NEW!" after the title; Transcenda's logo squashed to 64 × 28 and floated left; company, role (green), dates (green) on their own lines; square bullets |
| Apps | stacked green cards with black borders, indented 40 px; Savant icon broken |
| Education | two Verdana 13 lines |
| About me | books 12 px apart with black borders, Siddhartha broken; Interests |
| Previous Experience | squashed 64 × 28 logos floated left; square bullets; entries 12 px apart |
| Footer | construction sign, counter `004271`, two badges, webring, "Last updated: 14.03.2002" |
| Margin | "Oh, snap!" note right of the table |

## Terminal chat panel

**Style: a Windows 98 window with an IRC log in a black terminal.** Why: chat conventions (nicks, joins, timestamps) read instantly as "people talking", the black terminal says "an agent at work", and the Win98 frame dates it to the page's era. Green phosphor for the agent, amber for the visitor: two colours that can't be confused and both clear AA on black.

- **Window**: `--retro-win-face` `#C0C0C0`, 3 px padding, Win98 bevel (inset 1 px `#0A0A0A`/`#FFFFFF`, 2 px `#808080`/`#DFDFDF`) plus a hard `4px 4px 0 rgba(0,0,0,.35)` shadow. Chrome font `--retro-win-font` (Tahoma → Verdana on macOS) 11 px, black. The panels declare their own font, colour and background, so token layers on `:root` never restyle them (ARCHITECTURE → App integration).
- **Title bar**: 18 px, `--retro-win-title` gradient `#000080 → #1084D0`, white bold 11 px, 3 px left padding; 14 px icon (speech bubble `#FFFF99`, black outline), title `#andrew-cv - agent chat`, one 16 × 14 bevelled `_` button (minimise). No close button (no skip in scope).
- **Log** (`role="log"`, `aria-live="polite"`): sunken black field (`--retro-term-bg`), 2 px under the title, padding 6 × 8, `--retro-term-font` **Courier New** 13/18 (as it renders today; GRA-49 keeps it), wraps anywhere, hanging indent 7ch so text lines up after the timestamp; messages 4 px apart; follows the last line.
  - System: `[20:14] *** Now talking in #andrew-cv`, all `--retro-term-dim` `#808080`.
  - Agent: `[20:14]` dim · `<agent>` weight 600 · text, all `--retro-chat-agent` `#33FF66`.
  - Visitor: `[20:14]` dim · `<you>` weight 600 · text, all `--retro-chat-visitor` `#FFB000`.
  - Time: the visitor's local `HH:MM`. Agent replies stream in (as tokens arrive, or 40 chars/s for scripted lines).
- **Input**: separate sunken black field, 2 px below the log, padding 5 × 8, mono 13/18. Prompt `you>` amber, 1ch gap, typed text amber, block caret (1ch × 1.1em, blinks 1 s). Empty: caret + placeholder `type here, press Enter` (dim). Enter sends; empty input does nothing; 500 characters max. Disabled after the visitor's 10th message (ARCHITECTURE): prompt and text turn dim, placeholder shows the limit line.
- **Status bar**: 2 px below, three sunken cells: `● connected` (flex), `2 users`, `EN`.

## Live-fix console

- Same chrome. Title: terminal icon (black screen, green `>_`), `fix.exe - live console`, `_` button.
- **Screen**: sunken black field, padding 6 × 8, `--retro-term-font` **12/17** (`--retro-code-font-size`/`-line-height`: code lines are longer than chat lines), hanging indent 2ch, wraps anywhere. Top-anchored; follows the last line once full.
- **What it prints** (the text is generated, ARCHITECTURE → Code shown = code applied; this is its look):

| Line | Example | Look |
|---|---|---|
| prompt | `$ agent fix --live andrew-cv` | white |
| step title | `// 3/8 layout` | dim `#808080` |
| **target** (GRA-49) | `// → header` | dim; first line of every chunk that has a target; typed like the rest |
| layer file | `--- layers/header-layout.css` | white, weight 600 |
| rule layer text | `- [data-retro-stage] main {` | whole line `--retro-code-del` `#FF5555` on `--retro-code-del-bg` (10 % red); every non-blank line of the file, verbatim |
| token diff, old | `- --font-body-size: 11px;` | as above |
| token diff, new | `+ --font-body-size: 15px;` (read live) | `+` in `--retro-code-add` `#55FF55` on `--retro-code-add-bg`, syntax colours |
| decoration | `document.getElementById('oh-snap').remove();` | syntax colours, 2ch gutter |
| module | `const { ChatRoute } = await import('./chat');` | syntax colours |
| chunk done | `✓ header-layout removed` · `✓ chat button loaded` | `#55FF55`, indented 2ch; printed at the apply, right under the chunk's last line |
| step done | `✓ 3/8 layout` | `#55FF55` |
| skipped | `// skipped: <reason>` | dim |
| end | `$` then `all fixes applied. Welcome to 2026.` | white, then `#55FF55` |

  Syntax colours (the VGA palette): keywords/selectors `--retro-code-selector` `#55FFFF`; properties `--retro-code-property` `#FFFF55`; strings `--retro-code-string` `#55FF55`; numbers, colours, `:root`, at-rules `--retro-code-number` `#FF55FF`; the rest `--retro-term-text` `#C0C0C0`.
- **Caret**: block `#C0C0C0` at the end of the line being typed; it rests after the `✓` line during the beat.
- **Progress row** under the screen: label 158 px (`Step 3 of 8: layout`, ellipsis), a sunken bar of `--retro-progress` `#000080` blocks (8 px block, 2 px gap), percentage right-aligned in 32 px. At the end: `All fixes applied`, 100 %.

## The fix list (atomic, GRA-49)

The show is **8 steps of 36 chunks**. A chunk is **one visible change**: one layer, decoration or module, one concern, one place on the page. It is typed, applied right after its own last character, and followed by a beat. Most chunks are ≤ 8 code lines; the few at 9–13 lines are still one concern in one place, and typing is capped at 1.3 s, so code never piles up. The last chunk loads the AI chat, so the end state is the real site.

Round 1's 3 steps (`tokens`, `layout`, `rest`) and GRA-46's 7 steps are superseded. Step 1 of the 7 (*fonts & colours*, 10 chunks, ≈ 22 s under one narration line) is split in two, so the narration keeps pace with the page (a line every 6–14 s).

Columns: **Lines** = code lines of the chunk (without its `// →` and `---` lines); **Target** = the `// → <label>` line and what the highlight marks (selectors under `[data-retro-stage]`; `page` = page-wide); **Motion** = how the change lands (Transitions); **s** = the chunk's time at normal motion (typing + 1 s beat).

**Step 1 · `fonts` · title `fonts`** · narration: *First, the fonts: let me bring them into this decade.*

| # | Chunk | Lines | Holds (retro) → today | Target | Motion | s |
|---|---|---|---|---|---|---|
| 1 | `type-faces` | 9 | headings in Times New Roman bold, card titles in Arial bold → the page font | headings: `[data-testid='cv-name']`, `h2` | morph | 2.3 |
| 2 | `type-family` | 4 | `--font-family` Verdana, `--letter-spacing` normal → Inter, 0.02em | page | morph | 1.9 |
| 3 | `type-scale-headings` | 8 | name 34/38, section titles 24/28 → 24/24, 21/22 | name & titles: `[data-testid='cv-name']`, `h2` | fade | 2.2 |
| 4 | `type-scale-text` | 8 | subsection 15/18, body 11/15 → 17/17, 15/22 | body text: `[data-testid='cv-summary']` | fade | 2.2 |
| 5 | `type-scale-cards` | 8 | card title 12, card body 11/14, meta 11 → 15, 14/20, 14 | cards & dates: `[data-agent-id='section:technologies']` | fade | 2.2 |
| 6 | `type-scale-details` | 8 | education 13/16, book title 11, author 10 → 17/21, 15, 13 | education & books: `[data-agent-id='section:education']`, `[data-agent-id='section:about']` | fade | 2.3 |

**Step 2 · `colours` · title `colours`** · narration: *Now the colours. Goodbye, star field.*

| # | Chunk | Lines | Holds (retro) → today | Target | Motion | s |
|---|---|---|---|---|---|---|
| 7 | `page-background` | 6 | `body` `#000033` + star tile, `main` `#FFFFCC` → plain page | page | morph | 1.7 |
| 8 | `base-colors` | 8 | `--color-bg` `#FFFFCC`, text `#000000`, secondary `#008000`, muted `#808080` → white, navy, blue-grey, muted navy | page | fade | 2.1 |
| 9 | `heading-colors` | 6 | name `#800080`, section titles `#CC0000` → navy | name & titles: `[data-testid='cv-name']`, `h2` | fade | 1.6 |
| 10 | `tech-fills` | 9 | technology cells `#CCFFFF`, *Product mindset* `#FFFF00`, *AI Tools* `#FFCCFF` → white | technologies: `[data-testid='cv-technology-card']` | fade | 2.2 |

**Step 3 · `layout` · title `layout`** · narration: *Now the layout. It's been leaning left since 2002.*

| # | Chunk | Lines | Holds (retro) → today | Target | Motion | s |
|---|---|---|---|---|---|---|
| 11 | `page-frame` | 10 | shell without max-width, `margin: 0`, `padding: 8px`; `main` 640 px wide, `padding: 6px`, `3px outset #C0C0C0` → centred column | page | morph | 1.8 |
| 12 | `header-layout` | 13 | photo left of the centred intro, contacts in one centred line → today's header grid, photo right, contacts under it | header: `[data-agent-id='section:header']` | morph | 2.3 |
| 13 | `tech-grid` | 9 | *Technologies* title centred, grid gaps 2/2 → left title, gaps 30/18 | technologies: `[data-agent-id='section:technologies']` | morph | 2.2 |
| 14 | `experience-heads` | 10 | heads as blocks, logo floated left → grid rows, dates right | experience: `[data-agent-id='section:latest-experience'] [data-testid='cv-experience-entry']` | morph | 2.3 |
| 15 | `app-stack` | 7 | apps stacked and indented 40 px, 4 px apart → the apps row | apps: `[data-agent-id='section:apps']` | morph | 1.8 |

**Step 4 · `images` · title `images`** · narration: *The pictures were in the wrong folder. Fixing the paths.*

| # | Chunk | Lines | Holds (retro) → today | Target | Motion | s |
|---|---|---|---|---|---|---|
| 16 | `broken-photo` | 6 | photo "doesn't load": bitmap pushed out, white box, 1 px inset outline, broken-image icon, radius 0 → the round photo | photo: `[data-agent-id='section:header'] > img` | morph | 2.1 |
| 17 | `oh-snap` (decoration) | 1 | the note → gone | note: `#oh-snap` | leave | 1.4 |
| 18 | `squashed-logos` | 8 | every experience logo 64 × 28 `object-fit: fill`, radius 0; logo column widened → today's logos | logos: `[data-testid='cv-experience-entry'] img` | morph | 2.2 |
| 19 | `broken-icon` | 6 | Savant icon broken → loads | Savant icon: `[data-agent-id='app:savant'] img` | morph | 2.1 |
| 20 | `broken-cover` | 6 | Siddhartha cover broken → loads | book cover: `[data-agent-id='book:siddhartha'] img` | morph | 2.1 |

**Step 5 · `cards` · title `cards`** · narration: *Tables are for data. Turning these into cards.*

| # | Chunk | Lines | Holds (retro) → today | Target | Motion | s |
|---|---|---|---|---|---|---|
| 21 | `tech-cells` | 11 | cells: `2px inset #C0C0C0`, radius 0, no shadow, padding 4, 2 px title gap; star and AI gradient hidden → cards with radius 12, shadow, star, gradient | technologies: `[data-testid='cv-technology-card']` | morph | 2.3 |
| 22 | `app-cells` | 10 | app cards `#CCFFCC`, `1px solid #000`, radius 0, no shadow, padding 4; square icons → app cards | apps: `[data-testid='cv-app-card']` | fade | 2.1 |
| 23 | `card-colors` | 8 | `--color-card-border` `#808080`, `--color-highlight` `#FFFF00`, `--color-app-accent` `#0000FF`, `--color-app-border` `#000000` → green borders, gold highlight, green accent | card borders: `[data-testid='cv-technology-card']`, `[data-testid='cv-app-card']` | fade | 2.2 |
| 24 | `book-frames` | 4 | covers with `2px solid #000`, no shadow → shadows | books: `[data-testid='cv-book'] img` | fade | 1.6 |

**Step 6 · `spacing` · title `spacing & lists`** · narration: *Giving everything room to breathe. Goodbye, `<hr>`.*

| # | Chunk | Lines | Holds (retro) → today | Target | Motion | s |
|---|---|---|---|---|---|---|
| 25 | `heading-rules` | 5 | `h2` margins 16/8 and a `2px groove` rule → 36/12, no rule | section titles: `h2` | fade | 1.6 |
| 26 | `bullets` | 9 | summary lines and experience bullets as list items (disc / square, 28 px indent) → today's lines | bullets: `[data-testid='cv-summary']`, `[data-agent-id='section:latest-experience']` | morph | 2.3 |
| 27 | `experience-rhythm` | 6 | entries 12 px apart, bullets 2 px under the head → 30 and 9 | experience: `[data-agent-id='section:latest-experience']` | fade | 1.9 |
| 28 | `about-spacing` | 6 | About subtitles 12/4, books 12 px apart → today's | about me: `[data-agent-id='section:about']` | fade | 1.8 |

**Step 7 · `chrome` · title `2002 chrome`** · narration: *Time to say goodbye to the marquee and the hit counter.*

| # | Chunk | Lines | Holds (retro) → today | Target | Motion | s |
|---|---|---|---|---|---|---|
| 29 | `top-bar` (decoration) | 1 | nav bar and marquee → gone | nav bar: `#top-bar` | leave | 1.4 |
| 30 | `new-bursts` | 12 | blinking "NEW!" bursts after *Latest relevant experience* and *AI Tools* → gone | NEW! badges: `[data-agent-id='technology:ai-tools']`, `[data-agent-id='section:latest-experience'] h2` | morph | 2.3 |
| 31 | `page-footer` (decoration) | 1 | construction sign, counter, badges, webring → gone | footer: `#page-footer` | leave | 1.4 |
| 32 | `decor-room` | 4 | `[data-testid='cv']` 72 px top and 216 px bottom padding → none | page | fade | 1.5 |
| 33 | `hide-header` | 3 | app header (language switcher) hidden → back | language switcher: `[data-testid='app-header']` | morph | 1.5 |

**Step 8 · `links` · title `links & contacts`** · narration: *Last: links, contacts, and a real chat button.*

| # | Chunk | Lines | Holds (retro) → today | Target | Motion | s |
|---|---|---|---|---|---|---|
| 34 | `link-style` | 6 | contact links `#0000EE` underlined, contact icons hidden → text-colour links with icons | contacts: `[data-agent-id='section:header'] address` | morph | 1.7 |
| 35 | `contact-labels` | 10 | bold `E-mail me:` and `Phone:` labels → gone | contacts: `[data-agent-id='section:header'] address` | morph | 2.3 |
| 36 | `ai-chat` (module) | 1 | the AI chat button loads (it sits under the dock until the windows close) | none | none | 1.4 |

Finale (fallback): `Done. This is Andrew's CV as it looks today. Questions? The chat button is bottom right.`

Order within a step runs down the page where it can, so the camera mostly moves one way; page-wide chunks change whatever is in view.

## Chunk rhythm and timing budget

One chunk, at normal motion:

| Phase | Duration | What happens |
|---|---|---|
| **target** | 0 (overlaps typing) | The highlight fades in on the target (150 ms). If the target is out of view and the visitor hasn't scrolled lately, the page smooth-scrolls to it (Show what changed → Scrolling). |
| **type** | chars ÷ 240 per s, clamped to **0.4–1.3 s** | The console types the chunk: `// → <label>`, the file line, the code. |
| **apply** | at the last character (after the show's own scroll has settled, ≤ 0.8 s) | The layer is removed (or the decoration leaves, or the module loads); `✓ <id> removed` prints under the code; the change transitions in (fade 450 ms, morph 500 ms, leave 250 ms); the highlight flashes its fill. |
| **beat** | **1.0 s** from the apply | Nothing else starts: the eye catches the change. The highlight holds 200 ms, then fades out over 800 ms, gone at the beat's end. The next chunk starts. |

Step overhead: narrate 0.6 s before the first chunk (the narration line keeps typing at 40 chars/s while the chunk types) and 0.3 s after the last beat before `✓ n/8 <title>`.

Budget (typing times from the real layer files and today's token values; a module's time assumes its chunk has loaded):

| Part | Time |
|---|---:|
| Intro: 3 s alone · greeting (≈ 2.7 s) · 2 s · console hand-off (≈ 1.7 s) | 9.3 s |
| 1 fonts (6 chunks) | 13.8 s |
| 2 colours (4) | 8.5 s |
| 3 layout (5) | 11.3 s |
| 4 images (5) | 10.8 s |
| 5 cards (4) | 9.1 s |
| 6 spacing & lists (4) | 8.6 s |
| 7 2002 chrome (5) | 9.0 s |
| 8 links & contacts (3) | 6.2 s |
| Finale line (≈ 2.2 s) · 3 s · windows close 0.65 s | 5.9 s |
| **Total** | **≈ 92 s** |

Visitor holds (typing ≤ 15 s, reply streaming ≤ 12 s) come on top; they happen only between chunks. Before GRA-49 the 7-step show took ≈ 71 s with 5 s of typing per step; the new show is ≈ 20 s longer because each of its 36 changes gets its own beat. The close delay after the finale drops from 4 s to 3 s to stay near 90 s.

## Transitions

Every page change lands with motion unless reduced motion is on. Two kinds, chosen per chunk (column *Motion*):

**fade** (CSS transitions, 14 chunks): the properties that can interpolate move from the retro value to today's value.
- Properties: `color`, `background-color`, `border-color`, `outline-color`, `text-decoration-color`, `font-size`, `line-height`, `letter-spacing`, `margin`, `padding`, `gap`/`row-gap`/`column-gap`, `border-width`, `border-radius`, `box-shadow`, `width`, `height`, `opacity`.
- Duration **450 ms** (`--retro-motion-duration`), easing `--chat-motion-easing` (`cubic-bezier(0.2, 0, 0, 1)`: fast out, soft landing), no delay. It starts at the apply and ends well inside the 1 s beat.
- Discrete properties in a fade chunk (e.g. `border-style` inset → solid) switch at the start; fade chunks are chosen so that nothing structural changes in them.
- The transition is on only while the chunk is being applied, not all show long: the CV's own motion and the retro page's marquee/blink are never affected.

**morph** (same-document View Transition, 18 chunks): for changes that can't interpolate: font family, layout reflow (grid ↔ block, float, centring, `max-width: none`), `display` changes (icons, star, bursts, the header), `list-style`, generated `content`, background images (the star tile), and the broken images.
- The browser captures the page, the layer is removed, and the old picture **cross-fades** into the new page over **500 ms** (`--retro-morph-duration`, `--chat-motion-easing`). The chunk's targets **move and resize** from their old box to their new one (each target is its own view-transition group where the browser supports automatic names; otherwise the page cross-fades as a whole).
- A broken image's chunk morphs the image alone: the broken box cross-fades into the picture: the picture "loads".
- The dock, the decorations and the highlight stay live and still during a morph (they are excluded from the captured page), so typing and the chat never freeze.
- While a morph runs (0.5 s), clicks on the page don't land; typing in the chat input continues. Acceptable for 0.5 s.
- **Without View Transitions** (older browsers): the change applies instantly; the highlight still shows where.

**leave** (decorations, 3 chunks): fade out + scale to 96 % over 250 ms, then gone.

**none**: the module chunk (nothing visible changes on the page until the windows close).

**Reduced motion**: no fade, no morph, no leave: every change is instant, as in round 1.

## Show what changed

### Highlight

- **Look**: a rectangle **4 px outside** the target's border box (`--agent-highlight-offset`), square corners, a **3 px line** (`--agent-highlight-width`): black dashes (`--retro-highlight-ink` `#000000`) on a console-green band (`--retro-code-add` `#55FF55`): the Paint selection in the terminal's colour, visible on the star tile, cream and white alike. No fill while typing; at the apply a fill flash of `--retro-code-add-bg` (`rgba(85,255,85,.1)`) in 100 ms, fading with the line.
- **Why not the page agent's highlight** (`--agent-highlight-*`: a 3 px outline in `--color-text-secondary`): its colour is a page token that the damage overrides mid-show (it would be green on the broken page and blue-grey later), it marks one element at a time, and it is drawn inside the CV. The show's highlight belongs to the agent and looks the same from the first chunk to the last. It reuses the agent's width and offset tokens.
- **Timing**: appears when the chunk starts (fade in 150 ms, `--retro-highlight-fade-in`), so the eye goes to the target while the code types; fill flash at the apply; holds 200 ms after the apply, then fades out over 800 ms (`--retro-highlight-fade-out`), gone when the beat ends. The next chunk's highlight appears as the old one is gone: at most one chunk is highlighted at a time.
- **Several matches** (e.g. every `h2`, every technology card): a rectangle on each match that is at least partly in the page area, up to 12; when none is in view, the first match (the one being scrolled to).
- **Follows the target**: the rectangles re-measure every frame while a fade changes the target's size, and snap to the new box when a morph applies.
- **Decoration targets** (the note, the nav bar, the footer): same look, on the decoration.
- `aria-hidden`, `pointer-events: none`, above the page and the decorations, under the dock.

### Page-wide changes

Chunks with target `page` (font family, background, base colours, the page frame, the decoration room) change everything in view, so a rectangle around one element would lie. Instead a **frame around the page area**: the same 3 px line, fixed, 6 px inside the viewport's left, top and bottom edges and 6 px left of the dock (`--retro-page-frame-inset`), no fill; same timing. No scroll: whatever the visitor is looking at changes.

### Scrolling

- Before a chunk types, the show looks at its **first target** (the first match in page order). It is **in view** when at least half of it, or at least 160 px of it (for tall targets), is inside the page area.
- **Out of view**: smooth scroll (`behavior: 'smooth'`) so the target's top lands 24 px below the viewport top (`--agent-scroll-margin-top`, as the page agent's scroll). The apply waits until the scroll has settled (`scrollend`, at most 0.8 s), so the change is never missed.
- **The visitor comes first**: if the visitor scrolled in the last **4 s** (wheel, touch, keys, scrollbar: any scroll the show didn't start), the show doesn't scroll; the chunk runs where the visitor is looking, and its highlight marks the target (off-screen if it is). After 4 s without visitor scrolling, the next chunk scrolls again.
- The show never scrolls for `page` targets or the module chunk, never moves focus, and jumps instead of scrolling with reduced motion.
- Where the camera goes in a full run: header and summary (fonts), down to education and About (chunk 6), back up for the name (chunk 9), down through the layout to the apps, up to the photo (chunk 16), down to the logos, the apps and the books, and so on; each step reads top to bottom.

### In the console

Each chunk starts with `// → <label>` (dim), naming the target in plain words (`headings`, `header`, `Savant icon`, `page`). It ties the console to the page without covering the page with labels.

## End of the show

- The finale line types in the chat; the console shows `all fixes applied. Welcome to 2026.` and 100 %.
- **3 s** after the finale line ends, **the windows close with an animation** (GRA-49; round 1 closed them instantly). Win98 animated its minimise as a window shrinking into the taskbar; the close follows that:

| t (ms) | Console window | Chat window | Page |
|---|---|---|---|
| 0–150 | collapses to its title bar (the minimise look; `--retro-close-collapse` 150 ms) | — | — |
| 100–250 | — | collapses to its title bar | — |
| 150–400 | the title bar shrinks to 20 % towards the bottom-right corner, moves 24 px right and down, fades out (`--retro-close-fly` 250 ms) | — | — |
| 250–500 | — | same | the dock's 416 px reserve is released: `body` `padding-right` transitions to 0 over 400 ms (`--retro-reserve-duration`, `--chat-motion-easing`), so the column re-centres while the windows go |
| 650 | gone | gone | re-centred: the show ends (`done`) |

  Easing of both window phases `--retro-close-easing` (`cubic-bezier(0.4, 0, 1, 1)`: accelerating away). The chat starts 100 ms after the console (`--retro-close-stagger`). A minimised window skips the collapse. The composer stops taking input when the close starts.
- The AI chat button is already rendered (loaded by the last chunk) but sits under the dock (`--retro-z-index` 1001 > `--chat-z-index` 1000); it is uncovered as the chat window flies off. The terminal conversation doesn't carry over (ARCHITECTURE Q7).
- **Reduced motion**: both windows disappear at once and the page re-centres at once, as in round 1.

## Tokens (`retro-` prefix, in `src/theme/tokens.css`)

Round 1 (built, GRA-40/47):

| Token | Value | Use |
|---|---|---|
| `--retro-dock-width` | `384px` | dock width |
| `--retro-dock-inset` | `16px` | dock distance from the viewport edges |
| `--retro-dock-gap` | `12px` | gap between console and chat |
| `--retro-chat-height` | `344px` | chat window height |
| `--retro-win-face` | `#C0C0C0` | window face, buttons, progress track |
| `--retro-win-light` | `#FFFFFF` | bevel highlight |
| `--retro-win-light-inner` | `#DFDFDF` | inner bevel highlight |
| `--retro-win-shadow` | `#808080` | bevel shadow |
| `--retro-win-dark` | `#0A0A0A` | bevel outer dark |
| `--retro-window-shadow` | `rgba(0, 0, 0, 0.35)` | the windows' hard shadow |
| `--retro-win-title` | `linear-gradient(90deg, #000080, #1084D0)` | title bars |
| `--retro-win-title-text` | `#FFFFFF` | title text |
| `--retro-win-font` | `Tahoma, Verdana, 'Segoe UI', sans-serif` | window chrome |
| `--retro-win-font-size` | `11px` | title, status, progress label |
| `--retro-term-bg` | `#000000` | terminal fields |
| `--retro-term-font` | **`'Courier New', Courier, monospace`** (GRA-49: was `'IBM Plex Mono', 'Courier New', monospace`; IBM Plex Mono was never shipped, so this is what renders today) | chat and console |
| `--retro-term-font-size` / `--retro-term-line-height` | `13px` / `18px` | chat log and input |
| `--retro-code-font-size` / `--retro-code-line-height` | `12px` / `17px` | console |
| `--retro-term-text` | `#C0C0C0` | console default text, caret |
| `--retro-term-dim` | `#808080` | timestamps, system lines, step titles, target lines, placeholder |
| `--retro-chat-agent` | `#33FF66` | agent messages |
| `--retro-chat-visitor` | `#FFB000` | visitor messages, input |
| `--retro-code-selector` | `#55FFFF` | selectors, keywords |
| `--retro-code-property` | `#FFFF55` | properties |
| `--retro-code-string` | `#55FF55` | strings |
| `--retro-code-number` | `#FF55FF` | numbers, colours, at-rules |
| `--retro-code-add` / `--retro-code-add-bg` | `#55FF55` / `rgba(85,255,85,.1)` | added lines, ✓ lines; **the highlight's band and fill flash** |
| `--retro-code-del` / `--retro-code-del-bg` | `#FF5555` / `rgba(255,85,85,.1)` | removed lines |
| `--retro-progress` | `#000080` | progress blocks |
| `--retro-z-index` | `1001` | dock: above the AI chat button until the windows close |

New (GRA-49):

| Token | Value | Use |
|---|---|---|
| `--retro-highlight-ink` | `#000000` | the highlight's dashes |
| `--retro-page-frame-inset` | `6px` | page-wide frame, distance from the page area's edges |
| `--retro-highlight-fade-in` / `--retro-highlight-fade-out` | `150ms` / `800ms` | highlight in and out |
| `--retro-motion-duration` | `450ms` | fade chunks |
| `--retro-morph-duration` | `500ms` | morph chunks (view transitions) |
| `--retro-leave-duration` | `250ms` | decorations leaving |
| `--retro-close-collapse` / `--retro-close-fly` / `--retro-close-stagger` | `150ms` / `250ms` / `100ms` | window close phases |
| `--retro-close-easing` | `cubic-bezier(0.4, 0, 1, 1)` | window close, decorations leaving |
| `--retro-reserve-duration` | `400ms` | the dock reserve's release (replaces the 300 ms literal in `RetroShowScreen.module.css`) |

Reused as they are: `--agent-highlight-width` (3 px), `--agent-highlight-offset` (4 px), `--agent-scroll-margin-top`, `--chat-motion-easing`. The durations the runner waits for (beat, typing clamp, close total) are its own `timing.ts` numbers; the CSS durations above fit inside them.

Retro values of the **page** are not tokens: they live in the layer files and disappear with them. The **decorations'** own CSS (nav bar, marquee, counter, note) uses literal retro colours too (same exception as `layers/`).

## Texts (EN only, verbatim)

**Decorations and layers:**
- Nav: `Home` · `Resume` · `My Apps` · `Books` · `Guestbook` · `Links`
- Marquee: `*** Welcome to my homepage! *** Senior Android Engineer *** Creating Android apps since 2012 *** Please sign my guestbook! ***`
- Note: `Oh, snap!` / `Some pictures didn't load. Try pressing F5... or just wait a minute.`
- Contact labels (`contact-labels`): `E-mail me:` · `Phone:`
- Footer: `UNDER CONSTRUCTION` (in the SVG) · `You are visitor number 004271` · `[ << Prev | Android Devs Webring | Next >> ]` · `Last updated: 14.03.2002 · © 2002 Andrew Panasiuk. All rights reserved.`
- Browser tab title during the show: `Andrew Panasiuk - Homepage` (today's title comes back at the end).

**Chat** (the screen's `strings.ts`, except step lines, which are scenario data):
- Window title `#andrew-cv - agent chat` · status `● connected` · `2 users` · `EN` · minimise button label `Minimise` · input label (visually hidden) `Message the agent`
- System: `*** Now talking in #andrew-cv` · `*** agent has joined`
- Greeting: `Oops... looks like this site got stuck in 2002 and is a bit broken. Tell me what you think while I fix it.`
- Console hand-off: `Opening my console. Every line I type lands on the page right away.`
- Step narration and finale: the fix list above (the LLM may rephrase; these are the fallbacks and the tone: short, dry, friendly, never mocking the visitor or Andrew).
- Placeholder `type here, press Enter` · prompt `you>` · nicks `<agent>`, `<you>`
- Scripted reply when the LLM fails (ARCHITECTURE): `Noted! Back to fixing.`
- Limit reached (10 messages): `*** That's all I can take while I'm fixing. The chat button will be there when I'm done.`
- Over 500 characters: `*** Message too long (500 characters max).`
- Offline: `*** You're offline. The fixes keep going; the chat comes back when you do.`
- Example exchange in the renders (not scripted): `wow, a marquee! haven't seen one in 20 years` → `Enjoy it while it lasts. It's on my list.` · `much better already` → `Thanks! Wait till you see it centred.`

**Steps** (manifest, scenario data): titles `fonts` · `colours` · `layout` · `images` · `cards` · `spacing & lists` · `2002 chrome` · `links & contacts`; narration fallbacks in the fix list. LLM intents (one English line each, for the narrate prompt):
- `fonts`: Swap the 2002 typefaces (Verdana, Times New Roman, Arial) and tiny text sizes for today's font and type scale.
- `colours`: Replace the star-field background and the cream, black, red, purple and cyan colours with today's palette.
- `layout`: Move the page from a narrow table pushed to the left into the centred column and grids.
- `images`: Fix the broken image paths and the squashed logos, and remove the "Oh, snap!" note.
- `cards`: Turn the bevelled table cells into today's cards with borders, radius and shadows.
- `spacing`: Remove the horizontal rules and bullet lists and restore today's section spacing.
- `chrome`: Remove the nav bar, marquee, "NEW!" bursts, hit counter, badges and webring, and bring back the language switcher.
- `links`: Restore the contact links and icons, and load the real AI chat button.

**Target labels** (scenario data, after `// → `): `headings` · `page` · `name & titles` · `body text` · `cards & dates` · `education & books` · `technologies` · `header` · `experience` · `apps` · `photo` · `note` · `logos` · `Savant icon` · `book cover` · `card borders` · `books` · `section titles` · `bullets` · `about me` · `nav bar` · `NEW! badges` · `footer` · `language switcher` · `contacts`.

**Console:** window title `fix.exe - live console` · prompt `$ agent fix --live andrew-cv` · step titles `// n/8 <title>` · targets `// → <label>` · `✓ <id> removed` · `✓ chat button loaded` · `✓ n/8 <title>` · `all fixes applied. Welcome to 2026.` · progress `Step n of 8: <title>` · `All fixes applied`.

## Assets

All made for this package (GRA-38), hand-written SVG, **CC0**: no third-party art, logos or trademarks.

| File | Size | Used by |
|---|---|---|
| `assets/retro_tile_stars.svg` | 64 × 64, tiles | `page-background` via `--retro-tile-stars` |
| `assets/icon_broken_image.svg` | 16 × 16 | `broken-photo`, `broken-icon`, `broken-cover` via `--retro-broken-image` |
| `assets/badge_new.svg` | 40 × 20 | `new-bursts` via `--retro-badge-new` |
| `assets/sign_under_construction.svg` | 208 × 40 | `page-footer` (text in Arial Black; outline it to a path if exact rendering matters) |
| `assets/badge_800x600.svg` | 88 × 31 | `page-footer` |
| `assets/badge_guestbook.svg` | 88 × 31 | `page-footer` |

Fonts: Inter (shipped). The terminal font is the system Courier New (GRA-49: no IBM Plex Mono). Retro faces are system fonts and are **not** shipped (Comic Sans MS may not be redistributed); fallbacks: `'Comic Neue'` (OFL, only if Linux parity is wanted) then `cursive`; Verdana → `Geneva, sans-serif`; Times New Roman → `Times, serif`; Courier New → `Courier, monospace`.

## States and behaviour

- **Minimise `_`** (both windows): collapses the window to its title bar; the other takes the space; clicking the title bar restores. The show keeps running. The only window control.
- **Scrolling**: the page scrolls under the fixed dock; the show scrolls to out-of-view targets unless the visitor scrolled in the last 4 s (Show what changed → Scrolling).
- **Visitor typing / reply streaming**: holds the next chunk at chunk boundaries only (ARCHITECTURE → Holds): a chunk that started always finishes as shown; the chat keeps working while the console types.
- **Loading**: the broken page is visible at first paint (layers injected before the first render); no flash of today's design.
- **Failures**: a chunk that fails prints `// skipped: <reason>` and the show continues after its beat; with the LLM off, narration and replies are the scripted lines.
- **Accessibility**: chat log `role="log"` `aria-live="polite"`; console `role="log"` with `aria-live="off"` and `aria-label="Live fix console"`, plus a visually hidden live line per finished step (`Step 1 of 8 done: fonts`), not per chunk (36 announcements would flood a screen reader); progress `role="progressbar"` with `aria-valuenow`; decorations and the highlight `aria-hidden`. Focus is never moved by the show; the show's scroll never fights the visitor's. Contrast on black: `#808080` 5.3, `#FF5555` 6.7, `#33FF66` 15.6, `#FFB000` 11.5, `#C0C0C0` 11.5. The highlight's black dashes on the green band read on every page background (black on white 21:1, green on `#000033` 15:1). Retro page pairs on `#FFFFCC`: `#CC0000` 5.7, `#008000` 5.0, `#0000EE` 9.1, `#800080` 9.2. Two known misses, both short-lived: "remotely" `#808080` on `#FFFFCC` is 3.8:1 (gone at chunk 8); white title text on the light end of the title gradient is 4.0:1 (titles are short and sit on the navy end). The 11 px body text lasts until chunk 4.

## Data

- CV content: unchanged, from `CvRepository`.
- Scenario: step ids, titles, intents, narration fallbacks and finale (manifest, `src/data/retro/scenario.ts`); per step its chunks in order (`src/screens/retro/scenario.ts`): the effect, the target (label + selectors, or `page`, or none) and the motion (`fade` / `morph`; decorations always leave, modules have none). The fix list above is that data.
- Which images break and which squash is layer content (`broken-photo`, `squashed-logos`, `broken-icon`, `broken-cover`). The counter number is fixed text.

## Mock vs the real site

| Mock | Real site |
|---|---|
| CSS classes stand in for the CSS Modules (layers never select them) | hashed Module classes |
| Inter from Google Fonts | self-hosted `@fontsource` |
| Decorations placed by a small `place()` after layout | the retro screen's portal; same anchors |
| Layers read with XHR for the console | `?raw` imports |
| Highlight drawn statically for the chosen state (`typing` = outline, `applied` = with the fill flash) | fades in and out with the chunk; follows moving targets |
| No motion (renders use reduced motion) | fade, morph, leave, window close as specified |

## Decisions (defaults taken; the orchestrator may change them)

1. **Direction**: 2002 FrontPage/GeoCities homepage: one era, one look.
2. **Panels**: Win98 windows with black terminals (IRC log in the chat, diffs in the console), not a bare green-on-black terminal. Same era as the page; clearer structure.
3. **The windows stay retro** until they close at the end.
4. **POC = the architecture's 3 steps**; superseded by the atomic list (decision 12).
5. **Each effect applies when its own text is typed** (the runner does); GRA-49 adds that each effect is typed **on its own clock** with a beat after it (decision 13).
6. **The dock reserves its width** (the page lays out in viewport − 416 px) instead of overlapping the page.
7. **No alt text on broken images** (icon + box only), following the architecture.
8. **Decorations anchor to hooks** and never cover CV text; the note moves from the margin to the photo corner when the page frame is fixed.
9. **Minimise** is the only window control; no close (no skip in scope).
10. **Broken images**: 3 (photo, Savant, Siddhartha); every experience logo squashed (GRA-49; was 4 with Transcenda broken).
11. **Jokes stay in the furniture**; CV text is never altered or mocked.
12. **Atomic chunks** (GRA-49): one layer, decoration or module per chunk; one concern, one place; ≤ 8 code lines where possible, 9–13 for a few one-place concerns (header layout, technology cells, the bursts). 32 layer files replace the 12.
13. **Chunk rhythm**: type at 240 chars/s clamped to 0.4–1.3 s, apply at the last character, 1 s beat; narration 0.6 s ahead of a step's first chunk.
14. **8 steps**: *fonts & colours* is split into *fonts* and *colours* (it would carry 10 chunks under one narration line); the other six steps keep their titles and narration.
15. **Fade or morph per chunk**: CSS transitions (450 ms) for interpolable changes; a same-document View Transition (500 ms cross-fade, targets morph) for font family, reflow, `display`, background images and broken images; instant where View Transitions are missing.
16. **Highlight = the agent's own**: a Paint-style selection (black dashes on the console green, 3 px, 4 px out), show-owned, not the page agent's `--agent-highlight-*` outline (its colour is overridden by the damage and it marks one element).
17. **Highlight timing**: on when the chunk starts typing, fill flash at the apply, gone 1 s after the apply.
18. **Page-wide chunks** get a frame around the page area instead of a rectangle, and never scroll.
19. **Scrolling**: only when the first target is out of view, smooth, landing 24 px below the top; never within 4 s of the visitor's own scrolling.
20. **The console names the target** (`// → header`); no labels on the page.
21. **Windows close smoothly**: Win98 minimise-to-taskbar feel (collapse, then shrink away to the bottom-right), console first, chat 100 ms later, 650 ms in all, with the page re-centring from 250 ms; reduced motion: instant. The close delay after the finale drops from 4 s to 3 s (budget).
22. **Terminal font stays Courier New** (what renders today); `--retro-term-font` drops IBM Plex Mono, which was never shipped.
