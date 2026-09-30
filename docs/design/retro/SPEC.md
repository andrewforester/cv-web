# Retro Rebuild show (web) — design package

The look of the show. The mechanism (damage layers, decorations, runner, LLM, shell) is `docs/retro/ARCHITECTURE.md` (GRA-39); this package follows its model and vocabulary and only adds what it leaves to the design: retro values, layer contents, copy, the panels, timing feel, the full fix list.

## Source

- Designed from the brief of Linear **GRA-38** and the project *Retro Rebuild* (30 Sep 2026). **No screenshot or Figma frame exists.** The end state is today's design unchanged (`docs/design/cv/SPEC.md`, `src/theme/tokens.css`); the retro look comes from 1998–2006 references (below).
- `layers/*.css`: the **proposed damage layers**, ready to copy into `src/screens/retro/layers/`. They select only the architecture's hook contract (`[data-retro-stage]`, `data-testid`, `data-agent-id`, element types) and redefine only existing token names. They are the "old code" the console types, so they are written to read well.
- `mock.html`: a static mock. It renders today's CV with the **same element types and hooks** as `src/screens/cv` (styled by the real `src/theme/tokens.css` plus approximations of the CSS Modules), injects `layers/*.css` as `<link data-retro-layer>` at the end of `<head>`, draws the decorations in a portal, and generates the console text from the layer files and the live `tokens.css` values, as the runner will. Query params: `?state=broken|chat|console|step1-mid|step1|step2-mid|step2|rest-mid|end`, `&dock=0`. It reads files with XHR, so open it over http (`python3 -m http.server` in the repo root → `/docs/design/retro/mock.html`) or use `render.sh`.
- Renders are 1× (CSS px = image px), made by `render.sh` (headless Chrome, reduced motion, so marquee and carets hold still). **Render on macOS or Windows:** the retro faces (Verdana, Times New Roman, Comic Sans MS, Arial) are the "core fonts for the web", and Linux substitutes them.

| File | Viewport | Shows |
|---|---|---|
| `01-broken.png` | 1280 × 800 | t = 0: the broken 2002 page alone |
| `02-chat.png` | 1280 × 800 | page + terminal chat (greeting, one exchange, visitor typing) |
| `03-console.png` | 1280 × 800 | console open, step 1 narrated and starting to type (**before step 1**) |
| `04-step1-mid.png` | 1280 × 800 | **mid-step**: `tokens-type` applied (Inter, today's sizes), `tokens-colors` being typed |
| `05-after-step1.png` | 1280 × 800 | **after step 1** = before step 2 |
| `06-step2-mid.png` | 1280 × 800 | `layout-shift` being typed, page not moved yet |
| `07-after-step2.png` | 1280 × 800 | **after step 2** |
| `08-rest-mid.png` | 1280 × 800 | POC step 3 ("the rest") typing fast: images, cards, spacing already fixed |
| `09-end.png` | 1280 × 800 | finale: no damage left, switcher back, console 100 %; the windows close a few seconds later |
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

**Direction: "a 2002 personal homepage, made in FrontPage, hosted on GeoCities".** One coherent page, not a collage: a fixed 640 px table hard against the left edge on a star tile; Verdana 11 px body, Times New Roman headings in red, a purple name; a bevelled nav bar, a Comic Sans marquee, blinking "NEW!" bursts, an `<hr>` under every heading, default blue underlined links; images that don't load; a footer with a construction sign, hit counter, badges and a webring. The CV text stays exactly the same (a job-seeker's CV: the jokes are in the furniture, never in the content). The agent's tools are **Windows 98 windows with terminals inside**: same era as the page, so the screen reads as one 2002 desktop, while the agent's code is clearly 2026.

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
- **Page area**: while the dock is shown, `body` gets `padding-right: calc(var(--retro-dock-width) + 2 * var(--retro-dock-inset))` (416 px): show styling, not a damage layer. The page lays out in 864 px and the dock never covers content. The broken page is left-aligned, so reserving the space when the chat appears moves nothing. After the layout fix the column centres in the 864 px (x ≈ 96–768). When the windows close at the end, the reserve goes and the page centres in the full viewport (instant; see End of the show).
- The page scrolls under the fixed dock.
- **During the show there's no AI chat button and no language switcher** (the switcher's app header is hidden by the `hide-header` layer). Both come back through the fix steps (see the fix lists).

## Timeline

Timings follow ARCHITECTURE → State machine (`timing.ts`); the design values:

| t | What happens |
|---|---|
| 0 s | Page alone, fully broken. Marquee scrolls (18 s loop), "NEW!" bursts blink (1 s steps). |
| 3 s | Chat window appears (instant, like a Win98 window). Two system lines at once, then the greeting types at 40 chars/s (≈ 3 s). The input works from now on; focus is **not** moved into it. |
| greeting + 2 s | Agent (scripted): "Opening my console…". The console window appears above the chat and prints the prompt line. |
| then | Steps run. Each step: **narrate** (its chat line appears, ≈ 1 s) → **type** (console, ≈ 50 chars/s, clamped to 1.2–5 s per step; *fast* steps 3 s) → **apply** → **settle** 2.5 s. When the next step starts, the finished step collapses into one `✓ n/N <title>` line. |
| end | Finale line in the chat; console shows every step ✓ and 100 %. **4 s later both windows close** (instant) and the page is the real site, AI chat button included. |

**Apply per effect (design request).** A step is a list of effects (ARCHITECTURE → Scenario). The design wants each effect to apply when *its own* last character is typed, printing `✓ <id> removed` right under it, not the whole step at its end. Then a multi-effect step visibly changes the page in stages that match the code (`04-step1-mid.png`: the type tokens are already applied while the colour tokens are still being typed). If the runner applies per step, `04` shows the page unchanged instead; nothing else changes.

**Progress**: `(finished steps + share of the current step's effects applied) / N`, a Win98 block bar with `Step n of N: <title>` and the percentage.

**`prefers-reduced-motion`** (ARCHITECTURE Q4): code appears at once, applies after 1 s; marquee static (text starts at the left); no blinking (bursts and carets stay visible); chat lines appear whole.

## The broken page

### Damage layers (`layers/*.css`)

Each layer is one file; the table lists what it changes. "Step" is the full show (7 steps, below); "POC" is round 1 (3 steps). Token layers only redefine names in `src/theme/tokens.css`; rule layers only use hooks. Retro literals are allowed in layer files (ARCHITECTURE Q5).

| Layer | Kind | What it does (today → retro) | Step | POC |
|---|---|---|---|---|
| `tokens-type` | tokens | `--font-family` Inter → `Verdana, Geneva, sans-serif`; `--letter-spacing` 0.02em → `normal`; sizes: name 24/24 → 34/38, section 21/22 → 24/28, subsection 17/17 → 15/18, body 15/22 → 11/15, card title 15 → 12, card body 14/20 → 11/14, meta 14 → 11, education 17/21 → 13/16, book 15 and 13 → 11 and 10 | 1 | 1 |
| `tokens-colors` | tokens | `--color-bg` white → `#FFFFCC`; `--color-text` `#001670` → `#000000`; `--color-text-secondary` `#445598` → `#008000`; `--color-text-muted` → `#808080`; `--color-card-border` green → `#808080`; `--color-highlight` → `#FFFF00`; app text → `#000000`, accent → `#0000FF`, border → `#000000` | 1 | 1 |
| `type-faces` | rules | `h1`, `h2`, company and About subtitles (`h3`) in `'Times New Roman'` bold; technology and app card titles in `Arial` bold | 1 | 1 |
| `page-colors` | rules | `body` → `#000033` + star tile (`--retro-tile-stars`); `main` → `#FFFFCC`; name `#800080`; section titles `#CC0000`; technology cells `#CCFFFF`, *Product mindset* `#FFFF00`, *AI Tools* `#FFCCFF`; app cards `#CCFFCC` | 1 | 1 |
| `layout-shift` | rules | shell: no max-width, `margin: 0`, `padding: 8px`; `main`: `width: 640px`, `padding: 6px`, `border: 3px outset #C0C0C0` (the table); header: photo left of the centred intro, contacts in one centred line; *Technologies* title centred (crooked on purpose); technology grid gaps 30/18 → 2/2 (cellspacing); experience heads as blocks with the logo floated left; apps stacked and indented 40 px (a misused `<blockquote>`); book gap 37 → 12 | 2 | 2 |
| `broken-images` | rules | 4 images "don't load": photo, Transcenda logo, Savant icon, Siddhartha cover: bitmap pushed out (`object-position: -9999px 0`), white box, 1 px inset outline, broken-image icon (`--retro-broken-image`) at 2 px/2 px, radius 0. All other logos **squashed** to 64 × 28 (`object-fit: fill`), radius 0; logo column widens to fit | 3 | 3 |
| `table-cells` | rules | technology cards → cells: `2px inset #C0C0C0`, radius 0, no shadow, padding 4, 2 px title gap; star and AI gradient hidden. App cards: `1px solid #000`, radius 0, no shadow, padding 4. Logo/icon radius 0. Book covers: `2px solid #000`, no shadow | 4 | 3 |
| `old-rhythm` | rules | `h2`: margins 36/12 → 16/8 and an `<hr>` look (`border-bottom: 2px groove #C0C0C0`); summary lines and experience bullets become list items (disc / square, 28 px indent); experience entries 30 → 12 apart, bullets 9 → 2 px under the head; About subtitles 12/4 | 5 | 3 |
| `new-bursts` | rules | blinking "NEW!" burst (`--retro-badge-new`, 40 × 20) after *Latest relevant experience* and *AI Tools* titles (`::after`) | 6 | 3 |
| `decor-room` | rules | `[data-testid='cv']` gets 72 px top and 216 px bottom padding: the room where the top bar and footer decorations sit | 6 | 3 |
| `hide-header` | rules | hides the app header (`[data-testid='app-header']`, the language switcher) | 6 | 3 |
| `old-links` | rules | contact links `#0000EE` underlined; contact icons hidden; bold labels `E-mail me:` and `Phone:` (`::before`) | 7 | 3 |

Hooks used beyond the list in ARCHITECTURE → Hook contract: `address`, `figure`, `div` **only through `:has(…)` on a hook** (e.g. `div:has(> [data-testid='cv-technology-card'])` for the technology column), `:not()`, `::before`/`::after`. No Module classes, no `:nth-child`. The hook test (guard 2) covers them.

Host variables (set by the layer host from bundled assets, like `--retro-broken-image`): `--retro-broken-image` → `assets/icon_broken_image.svg`, `--retro-tile-stars` → `assets/retro_tile_stars.svg`, `--retro-badge-new` → `assets/badge_new.svg`.

### Decorations (show-owned DOM, portal, `aria-hidden`)

| Id | Anchor | Look | Step | POC |
|---|---|---|---|---|
| `top-bar` | top-left of `[data-testid='cv']`, its full width (inside the `decor-room` top padding) | **Nav**: `#000080` strip, 3 px padding, 8 px below; centred buttons `Home` `Resume` `My Apps` `Books` `Guestbook` `Links`: `#C0C0C0`, `2px outset #FFF`, padding 2 × 10, bold Verdana 11/14, black, underlined; not links. **Marquee**: black strip, 1 px `#FF0000` border, bold Comic Sans MS 13/20 `#FFFF00`, right to left, 18 s loop | 6 | 3 |
| `page-footer` | bottom of `[data-testid='cv']`, its full width, top edge 200 px above the bottom (inside the `decor-room` bottom padding) | 2 px groove rule on top, 8 px padding, centred, Verdana 11/16 black: `sign_under_construction.svg` (208 × 40) · "You are visitor number" + counter (6 digits, each a 12 px black cell, bold Courier New 14/18 `#33FF33`, 1 px gaps on `#404040`) · badges `badge_800x600.svg` and `badge_guestbook.svg` (88 × 31, 6 px apart) · webring line (underlined `#0000EE`, not links) · last-updated line | 6 | 3 |
| `oh-snap` | while `layout-shift` is on: 28 px right of `main`, 40 px below the header top (x ≈ 676, y ≈ 128); after: over the photo's top-right corner (right edge 28 px past the photo, top 12 px above it) | 184 px wide, padding 10 × 12, `#FFFF99`, 1 px `#CC9900`, hard shadow `3px 3px 0 #000`, Comic Sans MS 13/17 black, rotated 2.5°; `Oh, snap!` 18/24 `#CC0000` on its own line. It sits in the margin, never over CV text, and leaves with the images it complains about | 3 | 3 |

The alt text of a broken image isn't shown (CSS can't read it; ARCHITECTURE → Broken images). The icon and the empty box are enough.

### Per section: what the visitor sees

| Section | Broken (all layers) |
|---|---|
| Frame | star tile; a cream 640 px table with an outset grey border at x = 8, y = 8; nav bar and marquee at its top |
| Header | broken photo box (120 × 120) on the left; purple Times name, Verdana headline and italic tagline centred beside it; `E-mail me: …  Phone: …` centred below in blue underlined links, no icons |
| Summary | red Times title with a groove rule; six disc bullets, Verdana 11 |
| Technologies | centred red title; 3 columns of bevelled cells (cyan, one yellow, one pink), 2 px apart; "NEW!" after *AI Tools* |
| Latest relevant experience | "NEW!" after the title; broken Transcenda logo floated left; company, role (green), dates (green) on their own lines; square bullets |
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
- **Log** (`role="log"`, `aria-live="polite"`): sunken black field (`--retro-term-bg`), 2 px under the title, padding 6 × 8, `--retro-term-font` IBM Plex Mono 13/18, wraps anywhere, hanging indent 7ch so text lines up after the timestamp; messages 4 px apart; follows the last line.
  - System: `[20:14] *** Now talking in #andrew-cv`, all `--retro-term-dim` `#808080`.
  - Agent: `[20:14]` dim · `<agent>` weight 600 · text, all `--retro-chat-agent` `#33FF66`.
  - Visitor: `[20:14]` dim · `<you>` weight 600 · text, all `--retro-chat-visitor` `#FFB000`.
  - Time: the visitor's local `HH:MM`. Agent replies stream in (as tokens arrive, or 40 chars/s for scripted lines).
- **Input**: separate sunken black field, 2 px below the log, padding 5 × 8, mono 13/18. Prompt `you>` amber, 1ch gap, typed text amber, block caret (1ch × 1.1em, blinks 1 s). Empty: caret + placeholder `type here, press Enter` (dim). Enter sends; empty input does nothing; 500 characters max. Disabled after the visitor's 10th message (ARCHITECTURE): prompt and text turn dim, placeholder shows the limit line.
- **Status bar**: 2 px below, three sunken cells: `● connected` (flex), `2 users`, `EN`.

## Live-fix console

- Same chrome. Title: terminal icon (black screen, green `>_`), `fix.exe - live console`, `_` button.
- **Screen**: sunken black field, padding 6 × 8, IBM Plex Mono **12/17** (`--retro-code-font-size`/`-line-height`: code lines are longer than chat lines), hanging indent 2ch, wraps anywhere. Top-anchored; follows the last line once full.
- **What it prints** (the text is generated, ARCHITECTURE → Code shown = code applied; this is its look):

| Line | Example | Look |
|---|---|---|
| prompt | `$ agent fix --live andrew-cv` | white |
| step title | `// 1/3 fonts & colours` | dim `#808080` |
| layer file | `--- layers/tokens-type.css` | white, weight 600 |
| rule layer text | `- [data-retro-stage] main {` | whole line `--retro-code-del` `#FF5555` on `--retro-code-del-bg` (10 % red); every non-blank line of the file, verbatim |
| token diff, old | `- --font-body-size: 11px;` | as above |
| token diff, new | `+ --font-body-size: 15px;` (read live) | `+` in `--retro-code-add` `#55FF55` on `--retro-code-add-bg`, syntax colours |
| decoration | `document.getElementById('oh-snap').remove();` | syntax colours, 2ch gutter |
| module | `const { ChatRoute } = await import('./chat');` | syntax colours |
| effect done | `✓ tokens-type removed` · `✓ chat button loaded` | `#55FF55`, indented 2ch |
| step done | `✓ 1/3 fonts & colours` | `#55FF55` |
| skipped | `// skipped: <reason>` | dim |
| end | `$` then `all fixes applied. Welcome to 2026.` | white, then `#55FF55` |

  Syntax colours (the VGA palette): keywords/selectors `--retro-code-selector` `#55FFFF`; properties `--retro-code-property` `#FFFF55`; strings `--retro-code-string` `#55FF55`; numbers, colours, `:root`, at-rules `--retro-code-number` `#FF55FF`; the rest `--retro-term-text` `#C0C0C0`.
- **Caret**: block `#C0C0C0` at the end of the line being typed.
- **Progress row** under the screen: label 158 px (`Step 2 of 3: layout`, ellipsis), a sunken bar of `--retro-progress` `#000080` blocks (8 px block, 2 px gap), percentage right-aligned in 32 px. At the end: `All fixes applied`, 100 %.

## POC (round 1): 3 steps

ARCHITECTURE fixes the POC as `tokens`, `layout`, `rest`. Titles, narration fallbacks and effects:

| # | Id | Title | Narration (fallback) | Effects in order |
|---|---|---|---|---|
| 1 | `tokens` | `fonts & colours` | First, fonts and colours: let me bring them into this decade. | `tokens-type`, `tokens-colors`, `type-faces`, `page-colors` |
| 2 | `layout` | `layout` | Now the layout. It's been leaning left since 2002. | `layout-shift` |
| 3 | `rest` (fast) | `the rest` | And the rest: pictures, cards, spacing and that marquee. Fast-forwarding. | `broken-images`, `oh-snap`, `table-cells`, `old-rhythm`, `new-bursts`, `top-bar`, `page-footer`, `decor-room`, `hide-header`, `old-links`, module `ai-chat` |

Finale (fallback): `Done. This is Andrew's CV as it looks today. Questions? The chat button is bottom right.`

- **Step 1** (before `03`, mid `04`, after `05`): the console prints `tokens-type.css` as 18 token diffs, then `tokens-colors.css` (9), then the two rule files. After it: Inter in navy on white; still the 640 px table on the left, nav bar, marquee, `<hr>`s, bullets, broken images, bevelled cells, blue links, the note on the white margin.
- **Step 2** (before `05`, mid `06`, after `07`): prints `layout-shift.css` verbatim (≈ 50 lines, typed within the 5 s cap). After it: centred column, header grid with the broken photo on the right and contacts under it, 3 technology columns 30 px apart, experience heads as grid rows with dates right, apps in a row; the note moves onto the photo corner. Nav bar and marquee now span the centred column.
- **Step 3** (`08` mid, `09` end): everything else, typed fast; the AI chat button loads with the last effect.

## Full fix list (later rounds)

The same layers, one concern per step. The last step loads the AI chat, so the end state is the real site from round 1 on.

| # | Title | Effects | Visible change | Narration (fallback) |
|---|---|---|---|---|
| 1 | fonts & colours | `tokens-type`, `tokens-colors`, `type-faces`, `page-colors` | Inter, today's type scale, navy on white, tile gone | First, fonts and colours: let me bring them into this decade. |
| 2 | layout | `layout-shift` | centred column and today's grids | Now the layout. It's been leaning left since 2002. |
| 3 | images | `broken-images`, `oh-snap` | the 4 missing pictures load, logos unsquash, round photo; the note leaves | The pictures were in the wrong folder. Fixing the paths. |
| 4 | cards | `table-cells` | cells become cards: green borders, radius 12, shadows, highlight star, AI gradient; app cards; book shadows | Tables are for data. Turning these into cards. |
| 5 | spacing & lists | `old-rhythm` | `<hr>`s and bullets gone, today's section rhythm | Giving everything room to breathe. Goodbye, `<hr>`. |
| 6 | 2002 chrome | `new-bursts`, `top-bar`, `page-footer`, `decor-room`, `hide-header` | nav bar, marquee, bursts, counter, badges, webring gone; language switcher back | Time to say goodbye to the marquee and the hit counter. |
| 7 | links & contacts | `old-links`, module `ai-chat` | links in text colour with icons; the AI chat button appears | Last: links, contacts, and a real chat button. |

A round may add `focus` effects (ARCHITECTURE: scroll to and highlight the target with `--agent-highlight-*`) before steps 3–5, whose changes are mostly below the fold.

## End of the show

- The finale line types in the chat; the console shows `all fixes applied. Welcome to 2026.` and 100 %.
- 4 s after the finale line ends, both windows close (no animation) and the dock's 416 px reserve is released: the page re-centres in the full viewport. With motion allowed, `body` `padding-right` transitions over 300 ms (`--chat-motion-easing`); reduced motion: instant.
- The AI chat button is already rendered (loaded by the last effect) but sits under the dock (`--retro-z-index` 1001 > `--chat-z-index` 1000), so it appears the moment the windows close. The terminal conversation doesn't carry over (ARCHITECTURE Q7).

## Proposed tokens (`retro-` prefix; the Theme task R3 adds them to `src/theme/tokens.css`)

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
| `--retro-win-font-size` | `11px` | title, status, progress label |
| `--retro-term-bg` | `#000000` | terminal fields |
| `--retro-term-font` | `'IBM Plex Mono', 'Courier New', monospace` | chat and console (IBM Plex Mono, OFL, `@fontsource/ibm-plex-mono` 400 + 600) |
| `--retro-term-font-size` / `--retro-term-line-height` | `13px` / `18px` | chat log and input |
| `--retro-code-font-size` / `--retro-code-line-height` | `12px` / `17px` | console |
| `--retro-term-text` | `#C0C0C0` | console default text, caret |
| `--retro-term-dim` | `#808080` | timestamps, system lines, step titles, placeholder |
| `--retro-chat-agent` | `#33FF66` | agent messages |
| `--retro-chat-visitor` | `#FFB000` | visitor messages, input |
| `--retro-code-selector` | `#55FFFF` | selectors, keywords |
| `--retro-code-property` | `#FFFF55` | properties |
| `--retro-code-string` | `#55FF55` | strings |
| `--retro-code-number` | `#FF55FF` | numbers, colours, at-rules |
| `--retro-code-add` / `--retro-code-add-bg` | `#55FF55` / `rgba(85,255,85,.1)` | added lines, ✓ lines |
| `--retro-code-del` / `--retro-code-del-bg` | `#FF5555` / `rgba(255,85,85,.1)` | removed lines |
| `--retro-progress` | `#000080` | progress blocks |
| `--retro-z-index` | `1001` | dock: above the AI chat button until the windows close |

Retro values of the **page** are not tokens: they live in the layer files and disappear with them. The **decorations'** own CSS (nav bar, marquee, counter, note) uses literal retro colours too; see the question on the ticket (default: same exception as `layers/`).

## Texts (EN only, verbatim)

**Decorations and layers:**
- Nav: `Home` · `Resume` · `My Apps` · `Books` · `Guestbook` · `Links`
- Marquee: `*** Welcome to my homepage! *** Senior Android Engineer *** Creating Android apps since 2012 *** Please sign my guestbook! ***`
- Note: `Oh, snap!` / `Some pictures didn't load. Try pressing F5... or just wait a minute.`
- Contact labels (`old-links`): `E-mail me:` · `Phone:`
- Footer: `UNDER CONSTRUCTION` (in the SVG) · `You are visitor number 004271` · `[ << Prev | Android Devs Webring | Next >> ]` · `Last updated: 14.03.2002 · © 2002 Andrew Panasiuk. All rights reserved.`
- Browser tab title during the show: `Andrew Panasiuk - Homepage` (today's title comes back at the end).

**Chat** (the screen's `strings.ts`, except step lines, which are scenario data):
- Window title `#andrew-cv - agent chat` · status `● connected` · `2 users` · `EN` · minimise button label `Minimise` · input label (visually hidden) `Message the agent`
- System: `*** Now talking in #andrew-cv` · `*** agent has joined`
- Greeting: `Oops... looks like this site got stuck in 2002 and is a bit broken. Tell me what you think while I fix it.`
- Console hand-off: `Opening my console. Every line I type lands on the page right away.`
- Step narration and finale: the tables above (the LLM may rephrase; these are the fallbacks and the tone: short, dry, friendly, never mocking the visitor or Andrew).
- Placeholder `type here, press Enter` · prompt `you>` · nicks `<agent>`, `<you>`
- Scripted reply when the LLM fails (ARCHITECTURE): `Noted! Back to fixing.`
- Limit reached (10 messages): `*** That's all I can take while I'm fixing. The chat button will be there when I'm done.`
- Over 500 characters: `*** Message too long (500 characters max).`
- Offline: `*** You're offline. The fixes keep going; the chat comes back when you do.`
- Example exchange in the renders (not scripted): `wow, a marquee! haven't seen one in 20 years` → `Enjoy it while it lasts. It's on my list.` · `much better already` → `Thanks! Wait till you see it centred.`

**Console:** window title `fix.exe - live console` · prompt `$ agent fix --live andrew-cv` · step titles `// n/N <title>` · `✓ <id> removed` · `✓ chat button loaded` · `✓ n/N <title>` · `all fixes applied. Welcome to 2026.` · progress `Step n of N: <title>` · `All fixes applied`.

## Assets

All made for this package (GRA-38), hand-written SVG, **CC0**: no third-party art, logos or trademarks.

| File | Size | Used by |
|---|---|---|
| `assets/retro_tile_stars.svg` | 64 × 64, tiles | `page-colors` via `--retro-tile-stars` |
| `assets/icon_broken_image.svg` | 16 × 16 | `broken-images` via `--retro-broken-image` |
| `assets/badge_new.svg` | 40 × 20 | `new-bursts` via `--retro-badge-new` |
| `assets/sign_under_construction.svg` | 208 × 40 | `page-footer` (text in Arial Black; outline it to a path if exact rendering matters) |
| `assets/badge_800x600.svg` | 88 × 31 | `page-footer` |
| `assets/badge_guestbook.svg` | 88 × 31 | `page-footer` |

Fonts: Inter (shipped), IBM Plex Mono (OFL, new, panels only). Retro faces are system fonts and are **not** shipped (Comic Sans MS may not be redistributed); fallbacks: `'Comic Neue'` (OFL, only if Linux parity is wanted) then `cursive`; Verdana → `Geneva, sans-serif`; Times New Roman → `Times, serif`.

## States and behaviour

- **Minimise `_`** (both windows): collapses the window to its title bar; the other takes the space; clicking the title bar restores. The show keeps running. The only window control.
- **Scrolling**: the page scrolls under the fixed dock; round 1 doesn't scroll for the visitor.
- **Visitor typing / reply streaming**: holds the next step at safe points only (ARCHITECTURE → Holds); the chat keeps working while the console types.
- **Loading**: the broken page is visible at first paint (layers injected before the first render); no flash of today's design.
- **Failures**: an effect that fails prints `// skipped: <reason>` and the show continues; with the LLM off, narration and replies are the scripted lines.
- **Accessibility**: chat log `role="log"` `aria-live="polite"`; console `role="log"` with `aria-live="off"` and `aria-label="Live fix console"`, plus a visually hidden live line per finished step (`Step 1 of 3 done: fonts & colours`); progress `role="progressbar"` with `aria-valuenow`; decorations `aria-hidden`. Focus is never moved by the show. Contrast on black: `#808080` 5.3, `#FF5555` 6.7, `#33FF66` 15.6, `#FFB000` 11.5, `#C0C0C0` 11.5. Retro page pairs on `#FFFFCC`: `#CC0000` 5.7, `#008000` 5.0, `#0000EE` 9.1, `#800080` 9.2. Two known misses, both short-lived: "remotely" `#808080` on `#FFFFCC` is 3.8:1 (gone after step 1); white title text on the light end of the title gradient is 4.0:1 (titles are short and sit on the navy end). 11 px Verdana body lasts one step.

## Data

- CV content: unchanged, from `CvRepository`.
- Scenario: step ids, titles, narration fallbacks and finale (manifest, `src/data/retro/scenario.ts`); effects per step (`src/screens/retro/scenario.ts`): the tables above.
- Which images break and which squash is layer content (`broken-images.css`). The counter number is fixed text.

## Mock vs the real site

| Mock | Real site |
|---|---|
| CSS classes stand in for the CSS Modules (layers never select them) | hashed Module classes |
| Inter and IBM Plex Mono from Google Fonts | self-hosted `@fontsource` |
| Decorations placed by a small `place()` after layout | the retro screen's portal; same anchors |
| Layers read with XHR for the console | `?raw` imports |

## Decisions (defaults taken; the orchestrator may change them)

1. **Direction**: 2002 FrontPage/GeoCities homepage: one era, one look.
2. **Panels**: Win98 windows with black terminals (IRC log in the chat, diffs in the console), not a bare green-on-black terminal. Same era as the page; clearer structure.
3. **The windows stay retro** until they close at the end.
4. **POC = the architecture's 3 steps**; the full list is 7 steps over the same layers.
5. **Each effect applies when its own text is typed** (design request to the runner; see Timeline).
6. **The dock reserves its width** (the page lays out in viewport − 416 px) instead of overlapping the page.
7. **No alt text on broken images** (icon + box only), following the architecture.
8. **Decorations anchor to hooks** and never cover CV text; the note moves from the margin to the photo corner when the layout is fixed.
9. **Minimise** is the only window control; no close (no skip in scope).
10. **Broken images**: 4 (photo, Transcenda, Savant, Siddhartha); the rest squashed.
11. **Jokes stay in the furniture**; CV text is never altered or mocked.
