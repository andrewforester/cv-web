# Retro Rebuild show (web) — design package

The look of the show. The mechanism (damage layers, decorations, runner, LLM, shell) is `docs/retro/ARCHITECTURE.md` (GRA-39, as built: §9); this package follows its model and vocabulary and only adds what it leaves to the design: retro values, layer contents, copy, the panels, timing and motion, the fix list.

**Revision GRA-49 (30 Sep 2026)**, from the human's notes on the POC: the agent fixes the page in **atomic chunks** (one visible change each: a short code chunk typed, applied right after its last character, then a beat), page changes **transition smoothly**, the visitor **sees what changed** (a highlight on the target, scrolling to it), and the windows **close smoothly** at the end. The fonts stay as they are (the terminal font included). Sections changed by it: Source, Timeline, Damage layers, Terminal chat (font), Live-fix console, The fix list (atomic), Chunk rhythm and timing budget, Transitions, Show what changed, End of the show, tokens, texts, Decisions 12–22.

**Revision GRA-54 (1 Oct 2026, round 4)**, the human's final decisions on the show's **own UI** (the broken page, the damage layers, the scenario and the timing model stay): the agent chat takes **the site's AI chat look**; the live console becomes **Chrome DevTools (light theme), Console tab**, printing **console commands** with live ✖/⚠ counters instead of the Win98 progress bar; the highlight becomes **the Elements-tab selection** (box model + a size plate); the layout is **DevTools docked** to the right with the chat floating at the bottom right; the show **ends** with DevTools sliding out and the chat shrinking into the site's chat launcher. **New copy is professional and composed** (human, scope note on GRA-54): no irony, no exclamation marks; the existing narration lines are reworded later in GRA-58. Sections changed: Source, References, Screen layout, Timeline, Agent chat panel (was Terminal chat), DevTools console (was Live-fix console), the fix list's `Chars`/`s` columns, Chunk rhythm, Highlight, End of the show, Tokens, Texts, Assets, States, Shared components, Screenshot vs reference, Mock vs the real site, Decisions 23–40. **Superseded by GRA-54:** everything Win98, IRC, VGA and Paint below that isn't rewritten is history, not spec.

**Revision GRA-58 (1 Oct 2026)**: the show reads as a showcase of a developer's work, not a joke. Every agent line (greeting, hand-off, step narration, finale, scripted reply, notices, the LLM's voice) is reworded in a calm, professional tone that respects the 2002 build (Texts → Tone). Wording only: keys, structure and timing model unchanged; the old page's in-world texts stay.

**Revision CV-90 (2 Oct 2026, R23)**: the site under the show is now the **Forest `/`** (`docs/design/forest/SPEC.md`), so the broken page is refitted to it: the same 2002 homepage (star tile, 640 px cream table, Verdana/Times/Comic, bevels, marquee, "NEW!", blue links, broken images, footer furniture), drawn over Forest's hooks and tokens, and every chunk moves it toward the Forest page. Still 8 steps, 36 chunks, 32 layers, 3 decorations; step ids unchanged (`retro-3`). Sections changed: Source, Screen layout (meta bar), Damage layers (Forest refit), Decorations (note anchor), Per section, The fix list, Chunk rhythm budget, Texts (intents, fallbacks, labels), Decisions 46–52. Where this file still names the pre-Forest CV (`cv-name`, Inter, navy, logos, renders 01–12), that is history.

**Revision CV-95 (2 Oct 2026)**: the show also runs on **`/new`** (the Forest profile), over its own 2001 version: part **2001 `/new`** at the end of this file (direction, per-section look, damage layers, decorations, the 8 steps of 36 chunks with targets, console commands, timing, copy, decisions 53–64), its layer files in `new/layers/` and its render in `new/`. The mechanism per page is `docs/retro/ARCHITECTURE.md` §10. `/`'s show (everything above) is unchanged; only the Show case button section now covers both pages.

## Source

- Designed from the brief of Linear **GRA-38** and the project *Retro Rebuild* (30 Sep 2026); revised by **GRA-49**. **No screenshot or Figma frame exists.** The end state is today's design unchanged (`docs/design/cv/SPEC.md`, `src/theme/tokens.css`); the retro look comes from 1998–2006 references (below).
- `layers/*.css`: the **damage layers, one per chunk** (32 files), a copy of `src/screens/retro/layers/` as refitted to Forest in CV-90 (the code is the source; keep the copy in step when a layer changes). They select only the architecture's hook contract (`[data-retro-stage]`, `data-testid`, `data-agent-id`, element types) and redefine only existing token names. They are the "old code" the console types, so they are written to read well, and they are Prettier-formatted as they will be in `src/`.
- `mock.html`: a static mock of the **pre-Forest CV** (history since CV-90: its markup has the old hooks, so the refitted layers no longer hit it; the Forest show's reference renders are the web-check screenshots on CV-90: broken start, mid-show, end). It renders today's CV with the **same element types and hooks** as `src/screens/cv` (styled by the real `src/theme/tokens.css` plus approximations of the CSS Modules), injects `layers/*.css` as `<link data-retro-layer>` at the end of `<head>`, draws the decorations and the target highlight in a portal, and generates the console commands from the layer files and the live `tokens.css` values, as the runner does. The round-4 tokens (Tokens below) are declared at the top of its `<style>` until the theme task lands them. Query params: `?state=broken|chat|console|step1-mid|step1|colours-mid|step2-mid|step2|rest-mid|finale|closing|end`, `&dock=0`, `&vh=<px>` (the viewport height the `body` plate prints; headless Chrome reports a shorter one). It reads files with XHR, so open it over http (`python3 -m http.server` in the repo root → `/docs/design/retro/mock.html`) or use `render.sh`. It shows moments, not motion: transitions are described below, not mocked (`closing` is one static frame of the close).
- `ref/`: the human's reference screenshots (GRA-54), 2× retina: `devtools-panel.png` (DevTools in a custom pink Chrome theme: tab strip, error/warning badges) and `devtools-elements-highlight.png` (a page with `body` selected in the Elements tab: blue overlay and the `body 971×735` plate). They show *what* it looks like; values come from the site's tokens or, where the site has no role, from Chrome's **default** light theme (blue accent), not the pink theme of the screenshot.
- Renders are 1× (CSS px = image px), made by `render.sh` (headless Chrome, reduced motion, so marquee and carets hold still). **Render on macOS or Windows:** the retro faces (Verdana, Times New Roman, Comic Sans MS, Arial) are the "core fonts for the web", the console font is Menlo/Consolas, and Linux substitutes them.

| File | Viewport | Shows |
|---|---|---|
| `01-broken.png` | 1280 × 800 | t = 0: the broken 2002 page alone |
| `02-chat.png` | 1280 × 800 | page + **agent chat alone** (greeting, one exchange, visitor typing; focused composer) |
| `03-console.png` | 1280 × 800 | DevTools open (✖ 36 ⚠ 8), chunk 1 (`type-faces`) typing into the prompt row; the headings carry the box-model highlight, plate `h1.name × 8`; narration streaming |
| `04-step1-mid.png` | 1280 × 800 | fonts step mid-way: `type-scale-text` typing its `setProperty` lines, highlight on the summary |
| `05-after-step1.png` | 1280 × 800 | after *fonts* and *colours*: Inter, navy on white, still the 640 px table; steps 1–2 collapsed to `✓ 1/8 fonts`, `✓ 2/8 colours` |
| `06-step2-mid.png` | 1280 × 800 | **beat after a chunk**: `header-layout` just applied (`<· undefined`, `✓ header-layout removed`), the header's highlight with the content flash, plate `header.hdr 672 × 188` |
| `07-after-step2.png` | 1280 × 800 | after *layout* |
| `08-rest-mid.png` | 1280 × 800 | **box highlight on cards**: beat after `tech-cells`, every card in view highlighted (content blue, padding green), plate `div.card × 9` |
| `09-finale.png` | 1280 × 800 | finale: no damage left, switcher back, counters ✖ 0 ⚠ 0 (grey), `✓ All fixes applied.`; the panels close 3 s later |
| `10-colours-mid.png` | 1280 × 800 | beat after a **page-wide** chunk (`base-colors`): the page-area tint and plate `body 880 × 800` |
| `11-closing.png` | 1280 × 800 | one frame ≈ 60 % into the close: DevTools gone right, the chat card shrinking into the launcher, the page re-centring |
| `12-end.png` | 1280 × 800 | **end state**: today's site re-centred, the AI chat launcher bottom right |
| `full-broken.png`, `full-after-step2.png` | 1280 × 3000 | whole page without the dock |

`12-end.png` approximates today's site; the real site is the reference for the end state. Mock class names (`h1.name`, `div.card`, `header.hdr`) stand in for the CSS Module names the plate shows on the real site (Highlight → Plate).

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
| 14 | MS Paint's rectangle selection (Windows 95–XP) | The dashed "selection" line of the target highlight (GRA-49). **Superseded by GRA-54.** |
| 15 | Chrome DevTools, Console panel, default light theme; the human's `ref/devtools-panel.png` | The docked panel (GRA-54): tab strip with the active-tab underline, error/warning counters, the Console filter bar, prompt `›`, return values `<· undefined`, grouped messages, light syntax colours. |
| 16 | Chrome DevTools, Elements panel element highlight; the human's `ref/devtools-elements-highlight.png` | The highlight (GRA-54): content/padding/border/margin overlay and the tag + size plate. Chrome's colours: content `rgba(111,168,220,.66)`, padding `rgba(147,196,125,.55)`, border `rgba(255,229,153,.66)`, margin `rgba(246,178,107,.66)`; ours are lighter. |

Row 13 (98.css) is superseded by GRA-54 too: the panels are no longer Win98 windows.

**Direction: "a 2002 personal homepage, made in FrontPage, hosted on GeoCities".** One coherent page, not a collage: a fixed 640 px table hard against the left edge on a star tile; Verdana 11 px body, Times New Roman headings in red, a purple name; a bevelled nav bar, a Comic Sans marquee, blinking "NEW!" bursts, an `<hr>` under every heading, default blue underlined links; images that don't load; a footer with a construction sign, hit counter, badges and a webring. The CV text stays exactly the same (a job-seeker's CV: the jokes are in the furniture, never in the content). **The agent's tools (GRA-54) are today's tools**: Chrome DevTools docked to the right, its Console running the commands that change the page, the Elements-style highlight showing where, and a chat in the site's own AI-chat look. The page is 2002; everything the agent touches it with is current, so the contrast tells the story of a careful modernisation. (Round 1–3 had Win98 windows with terminals; superseded.)

## Screen layout during the show (1280 × 800, desktop only; GRA-54)

```
x: 0                                              880                       1280
   ┌─ page area (viewport − 400 px) ─────────────┐┌─ DevTools (docked) ───────┐ y 0
   │ broken: 640 px table at x = 8               ││ tab strip            28   │
   │ fixed:  672 px column centred (x 104–776)   ││ console filter bar   28   │
   │                                             ││ console rows (follow last) │
   │                                             ││   ┌─ agent chat card ───┐ │ y 392
   │                                             ││   │ 368 × 392, floating │ │
   │                                             ││   └─────────────────────┘ │ y 784
   └─────────────────────────────────────────────┘└───────────────────────────┘ y 800
   plate ▲ bottom-left corner of the first target     1 px left border, no shadow
```

- **Dock column**: 400 px (`--retro-dock-width`, was 384), rendered by the retro screen through its portal, `z-index: var(--retro-z-index)` (1001, above the AI chat button until the end).
- **DevTools panel**: `position: fixed`, `top: 0`, `right: 0`, `bottom: 0`, width 400 px: **flush to the top, right and bottom edges**, no inset, no radius, no shadow, a 1 px `--devtools-divider` left border, like real docked DevTools. Contents top to bottom: tab strip (28), console filter bar (28), console messages (the rest). The message area keeps its rows above the chat card with `padding-bottom: calc(var(--retro-chat-height) + 2 * var(--retro-dock-inset))` (424 px), so the prompt row is never under the chat; at 800 px tall that leaves 320 px (≈ 15 single-line rows) of console. **Decision 25:** the panel runs the full height and the chat floats over its lower part (real docked DevTools is full height; a panel that stops above the chat would leave a strip of page between them).
- **Agent chat card**: `position: fixed`, `right`/`bottom` 16 px (`--retro-dock-inset`), width `calc(var(--retro-dock-width) - 2 * var(--retro-dock-inset))` = 368 px, height 392 px (`--retro-chat-height`, was 344), the site chat panel's radius, gradient border and shadow (Agent chat panel). It sits above the DevTools panel (later in the dock's DOM, same z-index).
- **Before the console exists** (the first ≈ 6 s), only the chat card is shown; the column is reserved already.
- **Page area**: while the dock is shown, `body` gets `padding-right: var(--retro-dock-width)` (400 px; was 416 = width + 2 × inset): show styling, not a damage layer. The page lays out in 880 px and the dock never covers content. The broken page is left-aligned, so reserving the space moves nothing. After `page-frame` the 672 px column centres in the 880 px (x ≈ 104–776). At the end the reserve goes and the page re-centres in the full viewport (End of the show).
- The page scrolls under the fixed dock. The show scrolls it to a chunk's target when the target is out of view (Show what changed → Scrolling).
- **Highlight overlay**: show-owned, drawn in the portal over the page and under the dock; the **plate** sits on the first target's bottom-left corner (the page area's corner for a page-wide chunk).
- **Shorter viewports** (desktop ≥ 1024 wide, any height): the chat card height is `min(var(--retro-chat-height), 100dvh - 280px)` so at least ≈ 200 px of console stays visible (e.g. 700 px tall → chat 392, console ≈ 220; 600 px tall → chat 320, console ≈ 192). Width is fixed; the show doesn't run below 1024 px (ARCHITECTURE Q2).
- **During the show there's no AI chat button and no meta bar** (the Forest meta bar with `andrew.panasiuk / cv`, the Show case button and the language switcher is hidden by the `hide-meta-bar` layer; CV-90, was the app header's `hide-header`). Both come back through fix chunks.

## Timeline

Round 5 (GRA-87) flow. Timings are the runner's (`timing.ts`); the design values:

| t | What happens |
|---|---|
| start | The show starts only when asked: `?retro=1` (dev, e2e) or the app shell's start function (the coming **Show case** button). From today's site the show's chunk loads first (today's site stays on screen meanwhile), then in one frame the page scrolls to the top and turns into the broken 2002 page. Nothing starts on its own any more (no first-visit auto-start, no once-per-session rule); a replay is another start. |
| 0 s | Page alone, fully broken. Marquee scrolls (18 s loop), "NEW!" bursts blink (1 s steps). |
| 1 s | **Our chat opens**: the agent chat card appears with the site panel's open motion (fade + `translateY(8px) scale(.98)` → none, 200 ms `--chat-motion-duration`, `--chat-motion-easing`, origin bottom right) and streams **"That's how this CV would look like in 2001."** at 40 chars/s with the streaming caret. The composer works from now on; focus is **not** moved into it. |
| + 1 s pause | The agent streams **"Now let's fix it."** |
| + 0.8 s | **DevTools appears docked** (instant, as when DevTools opens), Console tab, with the opening log line, counters ✖ 36 ⚠ 8 and an empty prompt row. 0.8 s later the first step starts. |
| then | **8 steps of atomic chunks** (The fix list), with a **silent chat**: no narration in the chat. Each step: its console group opens and the step's **narration is typed into the prompt as a code comment** (`// …`, wrapped to the console width, 100 chars/s, 0.6–2 s), 0.6 s to read it → **chunk** → **chunk** → … → 0.3 s → the group collapses to `✓ n/8 <title>`, ⚠ − 1. The first chunk types on under the comment in the same prompt (one multi-line input). Each chunk: **target** (highlight + plate appear, scroll if needed) → **type** `// → <label>` and the command into the prompt row (≤ 1.3 s) → **apply** at its last character (the row becomes the echo, `<· undefined` and `✓ …` print under it, ✖ − 1, the change transitions in) → **beat** 1 s. The visitor can still write in the chat; replies appear there as before. |
| end | The console shows every group ✓, `✓ All fixes applied.`, ✖ 0 ⚠ 0. **1 s later DevTools collapses** (slides out to the right, 300 ms) while the page re-centres (400 ms). **1 s later** the chat streams **"All good now."**; **2 s later the chat collapses into the site's AI chat launcher** (500 ms). The page is the real site, AI chat button included (End of the show). |

**Total at normal motion ≈ 91 s** (Round 5, measured on the fake clock; Chunk rhythm and timing budget).

**Progress** (GRA-54): the **counters replace the Win98 progress row**. ✖ = chunks not done yet (36 → 0, −1 at each `✓`); ⚠ = steps not done yet (8 → 0, −1 when a step's group collapses). The step label lives in the console as the open group's title; the percentage is gone (Decision 27).

**`prefers-reduced-motion`** (ARCHITECTURE Q4): the same order and pauses without motion: each step's narration comment appears at once and the step reads it for 0.6 s; each chunk's command appears at once and applies 0.6 s later, then the 1 s beat; no transitions, no view transitions, no smooth scroll (jumps), the highlight appears and disappears without fading; the chat card appears without motion; at the end DevTools disappears at once, the page re-centres at once, and after "All good now." the chat disappears at once; marquee static (text starts at the left); no blinking (bursts and carets stay visible); chat lines appear whole. ≈ 78 s (Round 5).

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

**Forest refit (CV-90).** The table above is the GRA-49 history. On the Forest `/` the layers keep their ids and steps except three renames, and hit Forest's hooks (`forest-*` test ids, `cv-*` section test ids, `data-agent-id`, element types) and tokens (`--forest-*`):

| Layer | Holds on Forest (retro → Forest) |
|---|---|
| `type-faces` | name, `h2`, `h3` in Times New Roman bold; skill titles in Arial |
| `type-family` | `--forest-font-display`/`-text` Verdana, `-mono` Courier New, h1 letter spacing normal |
| `type-scale-headings` | name 34, **hero headline 15/18** (Forest's 84 px h1 becomes the small 2002 headline), subtitle 13, section labels 24 |
| `type-scale-text` | summary 12/16, body (bullets, card text) 11/15 |
| `type-scale-cards` | skill title 12, items 11/14, periods 11 |
| `type-scale-details` | company and education titles 13, roles 11, **footer CTA 13** |
| `page-background` | `body` `#000033` + star tile, `main` `#FFFFCC` |
| `base-colors` | `--forest-bg` `#FFFFCC`, ink `#000000`, ink-2 `#008000`, ink-3 `#808080` |
| `heading-colors` | name `#800080`, `h2` `#CC0000`; **gradient text flat** (the headline's `.`, *AI Tools*, the CTA's ↗ take the text colour: 2002 had no gradient text) |
| `tech-fills` | skill cells `#CCFFFF`, *Product mindset* `#FFFF00`, *AI Tools* `#FFCCFF` |
| `page-frame` | stage padding 8, `main` 640 px with 6 px padding and `3px outset #C0C0C0`, the CV article without side padding |
| `header-layout` | hero: photo left of the centred name, headline and tagline, no wrap; contacts in centred inline blocks |
| `tech-grid` | skills in 3 equal columns 2 px apart, *Skills* title centred |
| `experience-heads` | job rows as blocks: company, role, period stacked over the bullets |
| `app-stack` | app pills stacked, indented 40 px, 4 px apart |
| `broken-photo`, `broken-icon`, `broken-cover` | photo, Savant icon, Siddhartha cover "don't load" (white box, inset outline, broken-image icon) |
| `squashed-icons` (was `squashed-logos`) | app icons 64 × 28, `object-fit: fill`, square (Forest has no company logos) |
| `tech-cells` | skill rows as bevelled cells: `2px inset #C0C0C0`, padding 4, 2 px title gap |
| `app-cells` | app pills as `#CCFFCC` boxes, `1px solid #000`, square, padding 4 |
| `card-colors` | `--forest-line` `#808080`, `--forest-accent` `#0000FF` (rules, links, dashes, ring), `--forest-surface` `#C0C0C0`, Education/About fills (`--forest-card-sage/sand`) transparent |
| `book-frames` | covers with `2px solid #000`, square |
| `heading-rules` | sections 16 px apart (was Forest's 48–88), `h2` margins 16/8 and a `2px groove` rule |
| `bullets` | summary lines as disc items, job bullets as square items (Forest's "—" hidden) |
| `experience-rhythm` | job rows padded 8/12, bullets without gaps, 4 px under the head |
| `card-padding` (was `about-spacing`) | Education and About without their 24 px card padding |
| `new-bursts` | blinking "NEW!" after the latest job's company and after *AI Tools* |
| `decor-room` | CV article 72 px top and 216 px bottom padding for the nav bar and footer |
| `hide-meta-bar` (was `hide-header`) | the meta bar hidden |
| `link-style` | contact rows and the footer CTA `#0000EE` underlined; the contact ↗ hidden |
| `contact-labels` | bold `E-mail me:` and `Phone:` before the email and phone |

Rules for every layer stay: one concern in one place, no two layers set the same property on the same element (so `broken-icon` and `broken-cover` no longer set a radius: `squashed-icons` and `book-frames` own it), only hooks, retro literals only here.

Hooks used beyond the list in ARCHITECTURE → Hook contract: element types (`main`, `footer`, `h1`–`h3`, `ul`, `li`, `p`, `img`, `a`, `span`), `ul`/`li`/`div` **only through `:has(…)` on a hook** (e.g. `ul:has(> [data-testid='forest-skill'])` for the skills grid), direct children of a hook (`[data-testid='forest-job'] > div`), `[aria-hidden='true']` for Forest's decorative arrows and dashes, `:is()`, `::before`/`::after`. No Module classes, no `:nth-child`. The hook test (guard 2) covers them.

Host variables (set by the layer host from bundled assets): `--retro-broken-image` → `assets/icon_broken_image.svg`, `--retro-tile-stars` → `assets/retro_tile_stars.svg`, `--retro-badge-new` → `assets/badge_new.svg`. The host also defines `@keyframes retro-blink { 50% { visibility: hidden; } }` unless reduced motion is on.

### Decorations (show-owned DOM, portal, `aria-hidden`)

| Id | Anchor | Look | Removed by |
|---|---|---|---|
| `top-bar` | top-left of `[data-testid='cv']`, its full width (inside the `decor-room` top padding) | **Nav**: `#000080` strip, 3 px padding, 8 px below; centred buttons `Home` `Resume` `My Apps` `Books` `Guestbook` `Links`: `#C0C0C0`, `2px outset #FFF`, padding 2 × 10, bold Verdana 11/14, black, underlined; not links. **Marquee**: black strip, 1 px `#FF0000` border, bold Comic Sans MS 13/20 `#FFFF00`, right to left, 18 s loop | chunk 29 |
| `page-footer` | bottom of `[data-testid='cv']`, its full width, top edge 200 px above the bottom (inside the `decor-room` bottom padding) | 2 px groove rule on top, 8 px padding, centred, Verdana 11/16 black: `sign_under_construction.svg` (208 × 40) · "You are visitor number" + counter (6 digits, each a 12 px black cell, bold Courier New 14/18 `#33FF33`, 1 px gaps on `#404040`) · badges `badge_800x600.svg` and `badge_guestbook.svg` (88 × 31, 6 px apart) · webring line (underlined `#0000EE`, not links) · last-updated line | chunk 31 |
| `oh-snap` | while `page-frame` is on: 28 px right of `main`, 40 px below the header top (x ≈ 676, y ≈ 128); after: over the photo's (`forest-photo`, CV-90) top-right corner (right edge 28 px past the photo, top 12 px above it), following the photo when `header-layout` moves it | 184 px wide, padding 10 × 12, `#FFFF99`, 1 px `#CC9900`, hard shadow `3px 3px 0 #000`, Comic Sans MS 13/17 black, rotated 2.5°; `Oh, snap!` 18/24 `#CC0000` on its own line. It sits in the margin, never over CV text, and leaves right after the photo loads | chunk 17 |

**Leaving** (GRA-49): a removed decoration fades out and shrinks to 96 % over 250 ms (`--retro-leave-duration`, `--retro-close-easing`), then unmounts; reduced motion: at once.

The alt text of a broken image isn't shown (CSS can't read it; ARCHITECTURE → Broken images). The icon and the empty box are enough.

### Per section: what the visitor sees

Forest `/` (CV-90):

| Section | Broken (all layers) |
|---|---|
| Frame | star tile; a cream 640 px table with an outset grey border at x = 8, y = 8; nav bar and marquee at its top; no meta bar |
| Header | broken photo box (148 × 148) on the left; purple Times name, bold Verdana headline (15 px) and green tagline centred beside it; a blue 2 px rule |
| Summary | six disc bullets, Verdana 12 |
| Contacts | centred blocks: `E-mail me:` + address, `Phone:` + number, `WhatsApp`, `Telegram`, blue underlined links, no ↗ |
| 01 — Skills | red Times title, centred, groove rule; 3 columns of bevelled cells (cyan, one yellow, one pink), 2 px apart; "NEW!" after *AI Tools* |
| 02 — Experience | red Times title with a groove rule; each job as a block: company in Times, "NEW!" after the latest one, role and period in green/grey Verdana, square bullets; grey rules between jobs; app pills as stacked green boxes indented 40 px, icons squashed to 64 × 28, Savant's broken |
| 03 — Education | plain (no card): red Times title, Times degree, green place line |
| 04 — About me | plain: books with black borders, Siddhartha broken; interests in Verdana 11 |
| Footer | blue 2 px rule; `Let's build something ↗` as a 13 px blue underlined link; then the construction sign, counter `004271`, two badges, webring, "Last updated: 14.03.2002" |
| Margin | "Oh, snap!" note right of the table |

## Agent chat panel (GRA-54; was Terminal chat panel)

**Style: the site's AI chat panel** (`docs/design/chat/SPEC.md` → Panel — desktop; built in `src/screens/chat/`), same tokens and pieces, as a floating card. Why: the agent belongs to today's site, and when the site's chat is calmed down later the show follows (Shared components). The differences from the site's panel are listed here; anything not listed is the site's.

- **Card**: 368 × 392 (Screen layout), `--color-bg`, radius `--radius-card` (12), shadow `--chat-shadow-panel`, 1.5 px `--gradient-ai` border inside the box (the site's masked pseudo-element), `overflow: hidden`, column: header / [offline banner] / message list (flex 1) / composer. Inter, `--letter-spacing`, `--color-text`. Vertical budget: header 69 + list 218 + composer 105 = 392.
- **Token shield** (Decision 24): the token layers redefine site tokens on `:root` for most of the show (`--color-text: #000000`, `--font-family: Verdana…`, `--font-body-size: 11px`…). The dock root re-declares **the site's design tokens with their live values** as inline custom properties (every custom property of the `:root` rule in `src/theme/tokens.css`, read once at show start from the site's stylesheet with the same reader that gives the console its live token values), so the chat card always renders with today's values. Without it the chat would turn Verdana 11 px on cream mid-show. No layer touches `--devtools-*`.
- **Header** (69 = 12 + 44 + 12 + 1): the site's: badge 36 (`--gradient-ai`, `chat_icon_sparkle.svg` 20 px in `--color-text`), titles (gap 2): title **`Agent`** (17/22/500), subtitle **`Fixing this site live`** (14/20, `--color-text-secondary`). Right: **minimise** instead of close, a 44 × 44 icon button (`--chat-control-size`, radius `--radius-logo`, hover `--chat-color-divider`) with `assets/retro_icon_chevron.svg` at 20 px (chevron down). Width check: 16 + 36 + 12 + 240 + 12 + 44 + 8 = 368.
  - **Minimised**: the card collapses to its header (69 px, same bottom-right anchor; 200 ms `--chat-motion-easing`, instant with reduced motion), the chevron turns up (rotate 180°), `aria-expanded="false"`; the button or a click on the header restores. The console's bottom padding follows the card (69 + 32 px). The show keeps running. It replaces the Win98 `_` button; DevTools has no minimise (Decision 29).
- **Offline banner** (only offline): the site's, under the header, with the show's offline text.
- **What the agent says** (Round 5, GRA-87): only the two intro lines, the replies to the visitor and, at the end, "All good now.". The step narration is no longer in the chat (it is typed into DevTools as code comments); the greeting, the console hand-off line and the finale line are gone.
- **Message list** (`role="log"`, `aria-live="polite"`, `aria-label` `Conversation with the agent`): padding 16, column, gap 12, follows the last message; content width 336.
  - **Agent line**: the site's assistant bubble, left: white, 1 px `--color-card-border`, radius 12 with bottom-left 4 (`--chat-radius-tail`), padding 12 15, 15/22. Plain text.
  - **Visitor line**: the site's visitor bubble, right: `--color-text` fill, `--color-bg` text, max 85 % (286 px), padding 12 16, radius 12 with bottom-right 4, `pre-wrap`.
  - **Streaming**: an agent line that is still arriving (scripted at 40 chars/s, or LLM tokens) ends with the site's streaming caret (2 × 18 px, blinks 1 s; static with reduced motion). Waiting for an LLM reply's first token: the site's typing indicator (three 6 px dots) in an agent bubble.
  - **Notices** (limit reached, scripted fallback reply): a neutral agent bubble (the site's `NoticeRow`, tone `neutral`), no button.
  - **No timestamps, no nicks, no system lines**: `*** Now talking in #andrew-cv` and `*** agent has joined` are dropped; the `***` prefix of the limit and offline lines goes too.
  - Screen readers: visually hidden `You:` / `Agent:` before each line, as the site does.
- **Composer** (105): the site's: top divider, padding 12 16, gap 8; field (1 px `--color-text-muted`, radius 12, padding 5 5 5 15; focus-within: `--color-text` border + 1 px ring); textarea 15/22, one line = 44 high, grows to **3 lines** (the list is short) then scrolls; placeholder **`Message the agent…`** (`--color-text-muted`); Send: 44 round, `--color-text`, `chat_icon_send.svg` 20 px white, hover `--color-text-secondary`; disabled: `--chat-color-disabled-bg`, icon `--color-text-muted`. Width check: 1 + 15 + 262 + 8 + 44 + 5 + 1 = 336.
  - **Enter sends**, Shift+Enter inserts a newline, Enter while composing (IME) does nothing; empty input does nothing; focus stays in the field after sending. No Stop button: while a reply streams, Send is disabled (the show holds at chunk boundaries as before).
  - **Meta row** (caption 12/16, `--color-text-secondary`): `Answers are AI-generated and may contain mistakes.`; the counter `{count} / 500` appears from 400 characters; over 500 the field border, counter and meta text turn `--chat-color-error`, the meta text becomes `Message too long (500 characters max).` and Send is disabled (the site's pattern, replacing the round-1 log line; Decision 30).
  - **Limit reached** (the visitor's 10th message): the neutral notice with the limit line appears in the list; the field is disabled (border `--chat-color-divider`, no focus ring, placeholder unchanged, Send disabled).
  - **Closing** (end of the show, the chat's own collapse into the launcher): the composer stops taking input (same disabled look, no notice). While DevTools collapses and "All good now." streams, the composer still works.
- No close button, no Stop, no suggestion chips, no hint (the show's chat has a script, not an empty state).

## DevTools console (GRA-54; was Live-fix console)

**Style: Chrome DevTools, default light theme, Console tab**, docked right (Screen layout). Only the Console messages are real; the rest of the chrome is decoration: not clickable, `aria-hidden`. Colours are `--devtools-*` tokens (Tokens): Chrome's light theme where the site's tokens have no role.

### Panel chrome

- **Panel**: `--devtools-bg` (white), 1 px `--devtools-divider` left border, UI font `--devtools-ui-font` (system UI) at `--devtools-ui-font-size` (12) / 16, `--devtools-text`, `letter-spacing: normal`.
- **Tab strip** (28 high, `--devtools-toolbar-bg`, 1 px `--devtools-divider` bottom border, 2 px left padding), left to right:
  - inspect button: 28 wide, `assets/devtools_inspect.svg` 16 px in `--devtools-text-dim`; then a separator (1 × 16 px, margin 6 2, `--devtools-divider`);
  - tabs **`Elements` · `Console` · `Sources`**: padding 0 7, `--devtools-text-dim`; **Console** active: text `--devtools-accent`, a 2 px `--devtools-accent` underline across the tab at the strip's bottom edge;
  - `»` button (28, `devtools_more.svg`): *Network* and *Performance* live behind it, as Chrome does at this width (Decision 26);
  - flexible space;
  - **counters** (gap 6, padding 0 4, tabular figures): `devtools_error.svg` 16 px in `--devtools-error` + the count (3 px gap), then `devtools_warning.svg` in `--devtools-warning` + the count. At **0** the count stays (`0`) and the icon turns `--devtools-text-dim` (Decision 28). The numbers change at once, no animation;
  - separator, gear (`devtools_gear.svg`, 28), kebab (`devtools_kebab.svg`, 28).
  - Width check (399 inside the border): 2 + 28 + 5 + 66 + 60 + 60 + 28 + 75 (counters at `36` / `8`) + 5 + 28 + 28 = 385, flexible space 14.
- **Console filter bar** (28 high, `--devtools-bg`, 1 px bottom border, padding-right 4): clear (`devtools_clear.svg`, 28), separator, **`top`** + 12 px `devtools_triangle.svg` (`--devtools-text-dim`; padding 0 4 0 6), eye (`devtools_eye.svg`, 28), **filter field** (flex, 20 high, radius 10, `--devtools-input-bg`, padding 0 8, margin 0 4, placeholder **`Filter`** in `--devtools-text-dim`), **`Default levels`** + triangle.

### Messages

- `role="log"`, `aria-live="off"`, `aria-label="Live fix console"`; plus a visually hidden live line per finished step (States → Accessibility).
- Font `--devtools-code-font` (Menlo, Consolas, monospace) at `--devtools-code-font-size` / `--devtools-code-line-height` (11 / 16), `--devtools-text`. Top-anchored; once full it follows the last row; the bottom padding keeps the rows above the chat card (Screen layout). No visible scrollbar.
- **Row**: min height 21 (2 + 16 + 2 + 1), padding 2 8 2 24, 1 px `--devtools-row-divider` bottom border, `white-space: pre-wrap`, `word-break: break-all` (commands wrap at any character, as in DevTools: ≈ 55 characters per line at 400 px). Gutter icon: 16 px at left 4, top 2.

| Row | Example | Look |
|---|---|---|
| opening | `Agent connected to andrew-cv: 36 changes in 8 steps.` | console.log: default text, no icon; the numbers come from the plan |
| step group, open | `▾ 3/8 layout` | console.group: `devtools_triangle.svg` in `--devtools-text-dim`, title weight 700 (`n/8 <title>`). No extra indent for its rows (the panel is narrow) |
| step group, done | `▸ ✓ 3/8 layout` | the same group collapsed (triangle rotated −90°), `✓` in `--devtools-success`; its rows are hidden |
| narration (typing) | `› // Layout: replacing the fixed-width table layout,▏` | Round 5: the step's narration as a code comment, typed into the open group's prompt before its first chunk: `// ` + the line wrapped at word boundaries to **52 characters** per console line (the ≈ 55-character row minus the `// `), every line a comment (`--devtools-code-comment`). The first chunk then types under it in the same prompt; at the apply the whole input is the echo |
| prompt (typing) | `› // → header▏` | `devtools_prompt.svg` in `--devtools-accent`; the chunk's input as typed so far, syntax-coloured; caret 1 × 14 px `--devtools-text`, blinks 1 s (static with reduced motion); no bottom border |
| input echo | `› // → header` / `document.querySelector('style[data-retro-layer="header-layout"]').remove()` | at the apply the prompt row becomes the echo: same text, gains its bottom border; continuation lines align with the first, no extra `›` |
| result | `<· undefined` | `devtools_result.svg` and `undefined`, both `--devtools-text-dim` |
| chunk done | `✓ header-layout removed` | console.log output: `✓` in `--devtools-success`, text default, no icon |
| skipped | `⚠ header-layout skipped: <reason>` | console.warn: `devtools_warning.svg` in `--devtools-warning`, text `--devtools-warning-text` on `--devtools-warning-bg`, 1 px `--devtools-warning-border` above and below. ✖ still counts the chunk as done (Decision 31) |
| end | `✓ All fixes applied.` | console.log, weight 700 |
| empty prompt | `›▏` | after every apply and at the end: the prompt row with only the caret; the next chunk types into it |

Syntax colours (DevTools light): keywords (`const`, `await`, `import`) `--devtools-code-keyword` `#AA0D91`; strings `--devtools-code-string` `#C41A16`; numbers outside strings `--devtools-code-number` `#1C00CF`; comments (`// → …`) `--devtools-code-comment` `#236E25`; the rest (`document`, `querySelector`, punctuation) `--devtools-text`.

At the apply, in one frame: the prompt row turns into the echo, `<· undefined` and `✓ …` print under it, a new empty prompt row follows, and ✖ drops by one. When a step ends, its group collapses to `✓ n/8 <title>` and ⚠ drops by one; the next step's group opens with its first chunk.

### Console commands (code shown = code applied)

Each step's narration is typed as `// …` comment lines at the start of the step (Round 5); comments run nothing, so code shown = code applied still holds. Each chunk types **one console input**: its target comment (`// → <label>`, scenario data, as before), then the command for its kind. What is typed is what the engine does (`docs/retro/ARCHITECTURE.md` §2, revised by GRA-54):

| Chunk kind | Typed after `// → <label>` | What the engine does at the apply | Result | Done line |
|---|---|---|---|---|
| rule layer | `document.querySelector('style[data-retro-layer="header-layout"]').remove()` | removes that `<style>` (the host's element, attribute `data-retro-layer`) | `undefined` | `✓ header-layout removed` |
| token layer | `const { style } = document.documentElement`, then one `style.setProperty('<token>', '<today's value>')` per token of the layer, in file order | sets exactly those inline custom properties on `<html>` with the printed values (read live from the site's stylesheet, as the `+` lines were), then drops the layer's `<style>`, now inert | `undefined` | `✓ base-colors: 4 tokens set` |
| decoration | `document.getElementById('oh-snap').remove()` | the screen unmounts the decoration with that id | `undefined` | `✓ #oh-snap removed` |
| module (no target line) | `const { ChatRoute } = await import('./chat')` | the real `import()` of the chat chunk | `undefined` | `✓ chat button loaded` |

- String literals use single quotes; a value containing a single quote is printed in double quotes (`style.setProperty('--font-family', "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif")`), so every input is valid JavaScript a visitor could paste.
- The layer files are no longer printed (the round-1–3 `--- layers/<id>.css` and `-`/`+` lines are gone, Decision 32); they stay the damage source and the content of the commands' targets.
- At `done` the shell removes the inline custom properties from `<html>` together with the stage; no visible change (same values as `tokens.css`), and guard 3's end state stays trace-free.
- Example, step 3 after its second chunk:

```
▾ 3/8 layout
› // Layout: replacing the fixed-width table layout,
  // standard practice at the time, with a centred column
  // and grids.
  // → page
  document.querySelector('style[data-retro-layer="page-frame"]').remove()
<· undefined
  ✓ page-frame removed
› // → header
  document.querySelector('style[data-retro-layer="header-layout"]').remove()
<· undefined
  ✓ header-layout removed
› ▏
```

## The fix list (atomic, GRA-49)

The show is **8 steps of 36 chunks**. A chunk is **one visible change**: one layer, decoration or module, one concern, one place on the page. It is typed, applied right after its own last character, and followed by a beat. Most layer files are ≤ 8 code lines; the few at 9–13 lines are still one concern in one place. Since GRA-54 the console types a **command** per chunk, not the file (DevTools console → Console commands), and typing is capped at 1.3 s, so code never piles up. The last chunk loads the AI chat, so the end state is the real site.

Round 1's 3 steps (`tokens`, `layout`, `rest`) and GRA-46's 7 steps are superseded. Step 1 of the 7 (*fonts & colours*, 10 chunks, ≈ 22 s under one narration line) is split in two, so the narration keeps pace with the page (a line every 6–14 s).

Columns: **Chars** = characters the console types for the chunk, its `// → <label>` line included (GRA-54 commands; was **Lines**, the layer file's code lines); **Target** = the `// → <label>` line and what the highlight marks (selectors under `[data-retro-stage]`; `page` = page-wide); **Motion** = how the change lands (Transitions); **s** = the chunk's time at normal motion (typing + 1 s beat).

Forest `/` (CV-90). Selectors are hooks under `[data-retro-stage]`; token values on the right are Forest's (`src/theme/tokens.css`), read live by the console.

**Step 1 · `fonts` · title `fonts`** · narration: *Starting with typography: replacing the system fonts of the time with the current typeface and type scale.*

| # | Chunk | Chars | Holds (retro) → Forest | Target | Motion | s |
|---|---|---|---|---|---|---|
| 1 | `type-faces` | 84 | name, section labels and `h3`s in Times New Roman bold, skill titles in Arial → Onest / JetBrains Mono | headings: `[data-testid='forest-name']`, `h2` | morph | 1.8 |
| 2 | `type-family` | 449 | `--forest-font-display`/`-text` Verdana, `-mono` Courier New, h1 letter spacing normal → Onest, IBM Plex Sans, JetBrains Mono, −0.045em | page | morph | 2.3 |
| 3 | `type-scale-headings` | 388 | name 34, headline 15/18, subtitle 13, labels 24 → 19–21, 40–84 / 0.98, 19–24, 14 | name & headline: `[data-testid='forest-name']`, `[data-testid='forest-headline']`, `h2` | fade | 2.3 |
| 4 | `type-scale-text` | 298 | summary 12/16, body 11/15 → 18–20 / 1.55, 16 / 1.55 | body text: `[data-testid='forest-lead']` | fade | 2.3 |
| 5 | `type-scale-cards` | 302 | skill title 12, items 11/14, periods 11 → 16, 15 / 1.55, 13 | skills & dates: `[data-agent-id='section:technologies']` | fade | 2.3 |
| 6 | `type-scale-details` | 243 | company 13, role 11, footer CTA 13 → 20, 15, 28–52 | experience & education: `[data-agent-id='section:latest-experience']`, `[data-agent-id='section:education']` | fade | 2.3 |

**Step 2 · `colours` · title `colours`** · narration: *Colours: replacing the tiled background and the period palette with the current colour scheme, for readable contrast.*

| # | Chunk | Chars | Holds (retro) → Forest | Target | Motion | s |
|---|---|---|---|---|---|---|
| 7 | `page-background` | 85 | `body` `#000033` + star tile, `main` `#FFFFCC` → plain page | page | morph | 1.9 |
| 8 | `base-colors` | 230 | `--forest-bg` `#FFFFCC`, ink `#000000`, ink-2 `#008000`, ink-3 `#808080` → white, forest inks | page | fade | 2.3 |
| 9 | `heading-colors` | 93 | name `#800080`, labels `#CC0000`, gradient text flat → ink, accent green, the green-gold gradient back | name & titles: `[data-testid='forest-name']`, `h2` | fade | 1.9 |
| 10 | `tech-fills` | 82 | skill cells `#CCFFFF`, *Product mindset* `#FFFF00`, *AI Tools* `#FFCCFF` → no fill | skills: `[data-testid='forest-skill']` | fade | 1.8 |

**Step 3 · `layout` · title `layout`** · narration: *Layout: replacing the fixed-width table layout, standard practice at the time, with a centred column and grids.*

| # | Chunk | Chars | Holds (retro) → Forest | Target | Motion | s |
|---|---|---|---|---|---|---|
| 11 | `page-frame` | 80 | stage padding 8, `main` 640 px with an outset border, no side padding → the centred 1080 px column | page | morph | 1.8 |
| 12 | `header-layout` | 85 | photo left of the centred intro, contacts in centred blocks → hero with the photo right, contact rows | header: `[data-testid='forest-hero']` | morph | 1.9 |
| 13 | `tech-grid` | 81 | 3 equal columns 2 px apart, title centred → the skills grid | skills: `[data-agent-id='section:technologies']` | morph | 1.8 |
| 14 | `experience-heads` | 92 | job heads stacked over the bullets → company / role / period beside the bullets | experience: `[data-testid='forest-job']` | morph | 1.9 |
| 15 | `app-stack` | 79 | app pills stacked, indented 40 px, 4 px apart → the pill row | apps: `[data-agent-id='section:apps']` | morph | 1.8 |

**Step 4 · `images` · title `images`** · narration: *Images: correcting the asset paths and aspect ratios, so the photo, app icons and covers display properly.*

| # | Chunk | Chars | Holds (retro) → Forest | Target | Motion | s |
|---|---|---|---|---|---|---|
| 16 | `broken-photo` | 83 | photo "doesn't load": white box, inset outline, broken-image icon, square → the round photo with its green ring | photo: `[data-testid='forest-photo']` | morph | 1.8 |
| 17 | `oh-snap` (decoration) | 52 | the note → gone | note: `#oh-snap` | leave | 1.6 |
| 18 | `squashed-icons` | 89 | app icons 64 × 28 `object-fit: fill`, square → 36 px round icons | app icons: `[data-testid='forest-app'] img` | morph | 1.9 |
| 19 | `broken-icon` | 88 | Savant icon broken → loads | Savant icon: `[data-agent-id='app:savant'] img` | morph | 1.9 |
| 20 | `broken-cover` | 88 | Siddhartha cover broken → loads | book cover: `[data-agent-id='book:siddhartha'] img` | morph | 1.9 |

**Step 5 · `cards` · title `cards`** · narration: *Cards: converting the bevelled table cells into rows, pills and cards, which group related content more clearly.*

| # | Chunk | Chars | Holds (retro) → Forest | Target | Motion | s |
|---|---|---|---|---|---|---|
| 21 | `tech-cells` | 82 | skill cells: `2px inset #C0C0C0`, padding 4, 2 px title gap → rows under a 1 px line | skills: `[data-testid='forest-skill']` | fade | 1.8 |
| 22 | `app-cells` | 79 | app pills as `#CCFFCC` boxes, `1px solid #000`, square, padding 4 → round pills | apps: `[data-testid='forest-app']` | fade | 1.8 |
| 23 | `card-colors` | 292 | `--forest-line` `#808080`, `--forest-accent` `#0000FF`, `--forest-surface` `#C0C0C0`, Education/About fills transparent → forest line, green accent, surface, sage and sand cards | cards: `[data-testid='forest-app']`, `[data-agent-id='section:education']`, `[data-agent-id='section:about']` | fade | 2.3 |
| 24 | `book-frames` | 82 | covers with `2px solid #000`, square → 1 px line border, radius 6 | books: `[data-testid='forest-book'] img` | fade | 1.8 |

**Step 6 · `spacing` · title `spacing & lists`** · narration: *Spacing: replacing the horizontal rules and bullet lists with consistent section spacing, so the page is easier to scan.*

| # | Chunk | Chars | Holds (retro) → Forest | Target | Motion | s |
|---|---|---|---|---|---|---|
| 25 | `heading-rules` | 93 | sections 16 px apart, `h2` margins 16/8 and a `2px groove` rule → 48–88 px apart, no rule | section titles: `h2` | fade | 1.9 |
| 26 | `bullets` | 80 | summary lines as disc items, job bullets as square items → plain lines, "—" bullets | bullets: `[data-testid='forest-lead']`, `[data-agent-id='section:latest-experience']` | morph | 1.8 |
| 27 | `experience-rhythm` | 93 | job rows padded 8/12, bullets without gaps → 20 px rows, 8 px between bullets | experience: `[data-testid='forest-job']` | fade | 1.9 |
| 28 | `card-padding` | 95 | Education and About without padding → 24 px cards | education & about: `[data-agent-id='section:education']`, `[data-agent-id='section:about']` | fade | 1.9 |

**Step 7 · `chrome` · title `2002 chrome`** · narration: *Removing the navigation bar, marquee and footer badges of the original build, and restoring the meta bar.*

| # | Chunk | Chars | Holds (retro) → Forest | Target | Motion | s |
|---|---|---|---|---|---|---|
| 29 | `top-bar` (decoration) | 55 | nav bar and marquee → gone | nav bar: `#top-bar` | leave | 1.6 |
| 30 | `new-bursts` | 87 | blinking "NEW!" after the latest company and *AI Tools* → gone | NEW! badges: `[data-agent-id='section:latest-experience'] h3`, `[data-agent-id='technology:ai-tools'] h3` | morph | 1.9 |
| 31 | `page-footer` (decoration) | 58 | construction sign, counter, badges, webring → gone | footer: `#page-footer` | leave | 1.6 |
| 32 | `decor-room` | 80 | CV article 72 px top and 216 px bottom padding → Forest's | page | fade | 1.8 |
| 33 | `hide-meta-bar` | 87 | meta bar (`andrew.panasiuk / cv`, Show case, language switcher) hidden → back | meta bar: `[data-testid='forest-meta-bar']` | morph | 1.9 |

**Step 8 · `links` · title `links & contacts`** · narration: *Finally, links: restoring the contact rows and the footer link, and loading the AI chat assistant.*

| # | Chunk | Chars | Holds (retro) → Forest | Target | Motion | s |
|---|---|---|---|---|---|---|
| 34 | `link-style` | 81 | contacts and the footer CTA `#0000EE` underlined, contact ↗ hidden → ink rows with green ↗, the ink CTA | links: `ul:has(> li > [data-testid='forest-contact'])`, `footer a` | morph | 1.8 |
| 35 | `contact-labels` | 88 | bold `E-mail me:` and `Phone:` labels → gone | contacts: `ul:has(> li > [data-testid='forest-contact'])` | morph | 1.9 |
| 36 | `ai-chat` (module) | 44 | the AI chat button loads (it sits under the chat card until the end of the show) | none | none | 1.6 |

Finale (fallback): `All changes are applied. The site is up to date; the chat button in the bottom right corner answers questions about Andrew.`

Order within a step runs down the page where it can, so the camera mostly moves one way; page-wide chunks change whatever is in view.

## Chunk rhythm and timing budget

One chunk, at normal motion:

| Phase | Duration | What happens |
|---|---|---|
| **target** | 0 (overlaps typing) | The highlight fades in on the target (150 ms). If the target is out of view and the visitor hasn't scrolled lately, the page smooth-scrolls to it (Show what changed → Scrolling). |
| **type** | chars ÷ **100** per s, clamped to **0.6–1.3 s** (GRA-54; was 240 per s, 0.4–1.3 s) | The prompt row types the chunk's input: `// → <label>`, then the command. |
| **apply** | at the last character (after the show's own scroll has settled, ≤ 0.8 s) | The command runs (layer removed, tokens set, decoration leaves, or module loads); the row becomes the echo, `<· undefined` and `✓ …` print under it, ✖ − 1; the change transitions in (fade 450 ms, morph 500 ms, leave 250 ms); the highlight flashes its content box. |
| **beat** | **1.0 s** from the apply | Nothing else starts: the eye catches the change. The highlight and plate hold 200 ms, then fade out over 800 ms, gone at the beat's end. The next chunk starts. |

Step overhead (Round 5): the narration comment types at 100 chars/s (clamped 0.6–2 s; the fallbacks take ≈ 1–1.3 s), then 0.6 s to read it before the first chunk, and 0.3 s after the last beat before the group collapses to `✓ n/8 <title>`. (Until Round 5 the line streamed in the chat while the chunks typed, so only the 0.6 s counted.)

**Why the typing rate changes (GRA-54):** a command is 44–95 characters where the layer files were 80–290, so at 240 chars/s most chunks would hit the 0.4 s floor and the show would shrink to ≈ 77 s with code flashing past. At 100 chars/s a typical command takes ≈ 0.85 s (readable as typing) and the multi-token chunks still cap at 1.3 s, which keeps the ≈ 90 s budget.

Budget (Round 5, GRA-87): measured on the runner's fake clock (`showTiming.test.ts`) with the real copy, the fallback narration, a camera that settles at once and the chat chunk loading at once:

| Part | Time |
|---|---:|
| Intro: 1 s alone · `That's how this CV would look like in 2001.` (≈ 1.1 s) · 1 s · `Now let's fix it.` (≈ 0.4 s) · 0.8 s · DevTools open 0.8 s | 5.1 s |
| 1 fonts (6 chunks) | 12.0 s |
| 2 colours (4) | 9.3 s |
| 3 layout (5) | 11.3 s |
| 4 images (5) | 11.1 s |
| 5 cards (4) | 9.1 s |
| 6 spacing & lists (4) | 9.8 s |
| 7 2002 chrome (5) | 10.8 s |
| 8 links & contacts (3) | 7.2 s |
| Close: `✓ All fixes applied.` 1 s · DevTools collapses 0.4 s · 1 s · `All good now.` (≈ 0.3 s) · 2 s · the chat collapses 0.5 s | 5.2 s |
| **Total** | **≈ 91 s** |

CV-90 (Forest refit) re-measured the same way: ≈ 90.9 s, the steps within 0.1 s of Round 5. The fake clock reads no live token values, so its token chunks type only their first two lines; in the browser the 7 token chunks print their `setProperty` lines and hit the 1.3 s cap (≈ +5 s, ≈ 96 s), which the e2e motion-on run measures inside its 60–110 s window. Each step now includes its narration comment (≈ 1–1.3 s of typing for the fallbacks) and the 0.6 s read pause. When every targeted chunk waits the 0.8 s camera cap the show takes ≈ 92 s; with reduced motion ≈ 78 s. The intro (−4.2 s) and the close (−0.7 s) are shorter than in GRA-54, which pays for the comments, so the total stays ≈ 91 s. **The e2e motion-on timing smoke keeps its budget**: it fails past 110 s of show time (≈ 20 % over the total for the real chat chunk and the camera) or under 60 s.

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

**none**: the module chunk (nothing visible changes on the page until the end of the show).

**Reduced motion**: no fade, no morph, no leave: every change is instant, as in round 1.

## Show what changed

### Highlight (GRA-54: the Elements-tab selection)

- **Look**: Chrome's box-model overlay, as when an element is selected in the Elements tab (`ref/devtools-elements-highlight.png`), **lighter than Chrome** (the human asked for a lighter blue). Per highlighted element, four non-overlapping regions:

| Region | Area | Colour (token) | Chrome's |
|---|---|---|---|
| margin | margin box minus border box | `--retro-highlight-margin` `rgba(246,178,107,.3)` | `.66` |
| border | border box minus padding box | `--retro-highlight-border` `rgba(255,229,153,.4)` | `.66` |
| padding | padding box minus content box | `--retro-highlight-padding` `rgba(147,196,125,.3)` | `.55` |
| content | content box | `--retro-highlight-content` `rgba(111,168,220,.35)` | `.66` |

  Measured from the element's border box (`getBoundingClientRect`, page coordinates) and its computed margin, border and padding widths; negative margins draw nothing; a rotated element (the note) gets its axis-aligned box. No outline, no dashes, no offset: the round-3 Paint selection, its green band and `--agent-highlight-width`/`-offset` are gone from the show.
- **Flash at the apply**: the content region goes to `--retro-highlight-content-flash` `rgba(111,168,220,.6)` over `--retro-highlight-flash` (100 ms; this also settles the round-3 `TODO(theme)`), holds, then everything fades.
- **Timing** (as round 3): appears when the chunk starts (fade in 150 ms, `--retro-highlight-fade-in`), so the eye goes to the target while the command types; flash at the apply; holds 200 ms, then fades out over 800 ms (`--retro-highlight-fade-out`), gone when the beat ends. At most one chunk is highlighted at a time.
- **Several matches** (every `h2`, every technology card): an overlay on each match at least partly in the page area, up to 12; when none is in view, the first match (the one being scrolled to).
- **Follows the target**: the overlays and the plate's size re-measure every frame while a fade changes the target, and snap to the new box when a morph applies (the round-3 measuring windows).
- **Decoration targets** (the note, the nav bar, the footer): same overlay, on the decoration.
- `aria-hidden`, `pointer-events: none`, above the page and the decorations, under the dock; live during morphs (view-transition class `retro-live`, as round 3).

### Plate

The Elements-tab tooltip, pinned to the block: its **bottom-left corner sits on the bottom-left corner of the chunk's first target** (first match in page order, border box), inside the block and overlapping its corner. Shown with the highlight (same fade in, hold and fade out); it follows the block live (re-measured with the box on morphs, scroll and resize), with no animation of its own.

- **Clamping**: the plate stays in the page area (never under DevTools). A block's bottom edge below the viewport: the plate sticks to the bottom of the visible part; a left edge off the page area: it clamps to the page area's left edge (and to its right edge for a block starting past it); a block narrower than the plate: the plate overhangs to the right. Known limit: the plate's width isn't known when measuring, so a block starting just inside the page area's right edge can still overhang under the dock.
- **Several matches**: at the first match. **Page-wide chunks**: the page area's bottom-left corner (`left: 0`, `bottom: 0`). **Decorations**: their own box.

- **Look**: `--devtools-bg`, `--devtools-plate-shadow` (`0 1px 4px rgba(0,0,0,.24)`), square corners, padding 4 8, `--devtools-ui-font` 12/16, no wrapping; label and size 8 px apart.
- **Label**: the first match (page order): tag in `--devtools-node-tag` `#881280`, then `#id` (if any) and `.class` in `--devtools-node-class` `#1A1AA6`. The class is the element's first class with the CSS Modules hash removed, so it reads like source (`_title_k3j2a` → `title`); an element without a readable class shows its tag alone.
- **Size**: `W × H` of the first match's border box in whole px (spaces around `×`, U+00D7), `--devtools-text-dim`, tabular figures; **live**: it changes when the fix applies (a heading's height when its type scale lands, the header's when its layout does).
- **Several matches**: `<label> × N` with N = all matches on the page, no size (`h2.title × 9`, `div.card × 9`).
- **Page-wide chunks**: `body` + the page area's size, `880 × 800` at 1280 × 800.
- Examples (mock names; the real ones come from the CSS Modules): `header.hdr  672 × 188` · `h1.name × 8` · `div.card × 9` · `body  880 × 800`; a decoration shows its id (`div#oh-snap`).

### Page-wide changes

Chunks with target `page` (font family, background, base colours, the page frame, the decoration room) change everything in view, so a box around one element would lie. Instead the **whole page area is tinted** (fixed, `inset: 0`, `right: var(--retro-dock-width)`) with `--retro-highlight-page` `rgba(111,168,220,.2)`, flashing to `--retro-highlight-content` at the apply, plus the plate `body  880 × 800`; same timing, no rings. No scroll: whatever the visitor is looking at changes. (Round 3's dashed frame and `--retro-page-frame-inset` are gone.)

### Scrolling

- Before a chunk types, the show looks at its **first target** (the first match in page order). It is **in view** when at least half of it, or at least 160 px of it (for tall targets), is inside the page area.
- **Out of view**: smooth scroll (`behavior: 'smooth'`) so the target's top lands 24 px below the viewport top (`--agent-scroll-margin-top`, as the page agent's scroll). The apply waits until the scroll has settled (`scrollend`, at most 0.8 s), so the change is never missed.
- **The visitor comes first**: if the visitor scrolled in the last **4 s** (wheel, touch, keys, scrollbar: any scroll the show didn't start), the show doesn't scroll; the chunk runs where the visitor is looking, and its highlight marks the target (off-screen if it is). After 4 s without visitor scrolling, the next chunk scrolls again.
- The show never scrolls for `page` targets or the module chunk, never moves focus, and jumps instead of scrolling with reduced motion.
- Where the camera goes in a full run: header and summary (fonts), down to education and About (chunk 6), back up for the name (chunk 9), down through the layout to the apps, up to the photo (chunk 16), down to the logos, the apps and the books, and so on; each step reads top to bottom.

### In the console

Each chunk's input starts with `// → <label>` (a comment, `--devtools-code-comment`), naming the target in plain words (`headings`, `header`, `Savant icon`, `page`); the plate names the element. Together they tie the console to the page without labels on the page.

## End of the show (GRA-54; Round 5 sequence, GRA-87)

- The console shows every group collapsed with `✓`, then `✓ All fixes applied.`, ✖ 0 and ⚠ 0 (grey icons), and an empty prompt row. No finale line in the chat.
- Then, one thing at a time (the chat's lines and composer keep working until its own collapse):

| t (ms, from `✓ All fixes applied.`) | DevTools | Agent chat card | Page |
|---|---|---|---|
| 0–1 000 | stays: the visitor reads the zeros | — | — |
| 1 000–1 300 | **collapses**: slides out, `translateX(0 → 100%)`, `--retro-close-slide` 300 ms, `--retro-close-easing` (accelerating away), then stays hidden | stays where it is | the reserve is released: `body` `padding-right` 400 → 0 over `--retro-reserve-duration` (400 ms), `--chat-motion-easing`: the column re-centres (1 000–1 400) |
| 2 400 | gone | streams **"All good now."** (40 chars/s, ≈ 0.3 s) | re-centred |
| ≈ 4 700–5 200 | gone | 2 s after the line: **collapses into the launcher**. Header, list and composer fade out (`--retro-close-stagger` 150 ms, linear); the card's box moves and shrinks from `right`/`bottom` 16, 368 × 392, radius 12 to the launcher's box `right`/`bottom` 24, 56 × 56, radius 50 %; fill `--color-bg` → `--color-text`, shadow `--chat-shadow-panel` → `--chat-shadow-fab`; the gradient border stays and lands on the launcher's AI ring. `--retro-close-shrink` 500 ms, `--chat-motion-easing`. Over its last 100 ms the card fades out on top of the real launcher | |
| ≈ 5 200 | gone | gone; the real launcher stays | the show ends (`done`) |

  The launcher is already rendered (the module chunk loaded it) at its own place, `right`/`bottom` 24 px, 56 × 56 (`docs/design/chat/SPEC.md` → Launcher), under the dock (`--retro-z-index` 1001 > `--chat-z-index` 1000). The composer stops taking input when the chat's collapse starts. A minimised chat shrinks from its header box. The chat no longer waits for DevTools' stagger (`--retro-close-stagger` is now only the contents' fade).
- The agent conversation doesn't carry over into the AI chat (ARCHITECTURE Q7). If the site chat's first-visit hint has come due during the show, it is revealed next to the launcher as the card leaves.
- **Reduced motion**: the same order and pauses; DevTools disappears at once and the page re-centres at once; "All good now." appears whole; the chat disappears at once.

## Tokens (in `src/theme/tokens.css`; GRA-54 revision)

Round 4 adds a `--devtools-*` group (the DevTools look: Chrome's default light theme, where the site has no role), highlight colours and close timings, changes three dock values, and retires the Win98/terminal/VGA tokens. The agent chat uses **the site's existing tokens only** (`--color-*`, `--font-*`, `--space-*`, `--radius-*`, `--gradient-ai`, `--chat-*`). Values are declared at the top of `mock.html` until the theme task lands them.

**Dock (changed values):**

| Token | Value | Use |
|---|---|---|
| `--retro-dock-width` | `400px` (was `384px`) | DevTools panel width = the page's reserve (`padding-right`) |
| `--retro-dock-inset` | `16px` (unchanged) | the chat card's distance from the right and bottom edges |
| `--retro-chat-height` | `392px` (was `344px`) | the chat card's height |
| `--retro-z-index` | `1001` (unchanged) | dock: above the AI chat button until the end |

**DevTools (new):**

| Token | Value | Use |
|---|---|---|
| `--devtools-bg` | `#ffffff` | panel, filter bar, console, plate |
| `--devtools-toolbar-bg` | `#f3f6fc` | tab strip |
| `--devtools-input-bg` | `#e9eef6` | filter field |
| `--devtools-divider` | `#dadce0` | panel left border, toolbar bottoms, separators |
| `--devtools-row-divider` | `#f1f3f4` | between console rows |
| `--devtools-text` | `#1f1f1f` | console text, active labels, caret |
| `--devtools-text-dim` | `#5f6368` | inactive tabs, icons, `<· undefined`, placeholder, plate size, counters at 0 |
| `--devtools-accent` | `#0b57d0` | active tab text and underline, prompt `›` |
| `--devtools-error` | `#dc362e` | error counter icon |
| `--devtools-warning` | `#f29900` | warning counter icon, warning row icon |
| `--devtools-warning-bg` / `--devtools-warning-text` / `--devtools-warning-border` | `#fef7e0` / `#5c3c00` / `#fdeeb5` | skipped-chunk row |
| `--devtools-success` | `#188038` | `✓` in done lines and collapsed groups |
| `--devtools-code-keyword` | `#aa0d91` | `const`, `await`, `import` |
| `--devtools-code-string` | `#c41a16` | string literals |
| `--devtools-code-number` | `#1c00cf` | numbers outside strings |
| `--devtools-code-comment` | `#236e25` | `// → <label>` |
| `--devtools-node-tag` | `#881280` | plate: tag |
| `--devtools-node-class` | `#1a1aa6` | plate: `#id`, `.class` |
| `--devtools-ui-font` | `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | tabs, filter bar, plate |
| `--devtools-ui-font-size` | `12px` | same |
| `--devtools-code-font` | `Menlo, Consolas, 'DejaVu Sans Mono', monospace` | console rows |
| `--devtools-code-font-size` / `--devtools-code-line-height` | `11px` / `16px` | console rows |
| `--devtools-plate-shadow` | `0 1px 4px rgba(0, 0, 0, 0.24)` | plate |

Panel metrics stay screen-local custom properties, as the Win98 metrics were: toolbar height 28, button width 28, icon 16 (12 in the filter bar's selects), separator 1 × 16 with 6/2 margins, tab padding 0 7, row padding 2 8 2 24, row icon at 4/2, filter field 20 high with radius 10, plate padding 4 8.

**Highlight (new):**

| Token | Value | Use |
|---|---|---|
| `--retro-highlight-content` | `rgba(111, 168, 220, 0.35)` | content box; page tint's flash |
| `--retro-highlight-content-flash` | `rgba(111, 168, 220, 0.6)` | content box at the apply |
| `--retro-highlight-padding` | `rgba(147, 196, 125, 0.3)` | padding ring |
| `--retro-highlight-border` | `rgba(255, 229, 153, 0.4)` | border ring |
| `--retro-highlight-margin` | `rgba(246, 178, 107, 0.3)` | margin ring |
| `--retro-highlight-page` | `rgba(111, 168, 220, 0.2)` | page-wide tint |
| `--retro-highlight-flash` | `100ms` | the flash (was the screen-local `TODO(theme)` value) |

**Motion:** kept as they are: `--retro-highlight-fade-in` (150ms), `--retro-highlight-fade-out` (800ms), `--retro-motion-duration` (450ms), `--retro-morph-duration` (500ms), `--retro-leave-duration` (250ms), `--retro-close-easing` (now the DevTools slide), `--retro-reserve-duration` (400ms; the release now starts at 0 ms of the close, was 250 ms). New or changed:

| Token | Value | Use |
|---|---|---|
| `--retro-close-slide` | `300ms` | DevTools slides out |
| `--retro-close-shrink` | `500ms` | the chat shrinks into the launcher |
| `--retro-close-stagger` | `150ms` (was `100ms`) | the chat starts after DevTools |

Reused: `--chat-motion-easing`, `--chat-motion-duration` (the chat's entrance and minimise), `--chat-shadow-panel`, `--chat-shadow-fab`, `--agent-scroll-margin-top` (camera). The runner's own numbers (`timing.ts`) change only for typing: `codeCharsPerSecond` 100 (was 240), `chunkMinMs` 600 (was 400); `closingMs` stays 650.

**Retired by GRA-54** (unused once R16–R17 land; the theme task removes them after the screen stops reading them): `--retro-dock-gap`, `--retro-win-face`, `--retro-win-light`, `--retro-win-light-inner`, `--retro-win-shadow`, `--retro-win-dark`, `--retro-window-shadow`, `--retro-win-title`, `--retro-win-title-text`, `--retro-win-font`, `--retro-win-font-size`, `--retro-term-bg`, `--retro-term-font`, `--retro-term-font-size`, `--retro-term-line-height`, `--retro-code-font-size`, `--retro-code-line-height`, `--retro-term-text`, `--retro-term-dim`, `--retro-chat-agent`, `--retro-chat-visitor`, `--retro-code-selector`, `--retro-code-property`, `--retro-code-string`, `--retro-code-number`, `--retro-code-add`, `--retro-code-add-bg`, `--retro-code-del`, `--retro-code-del-bg`, `--retro-progress`, `--retro-highlight-ink`, `--retro-page-frame-inset`, `--retro-close-collapse`, `--retro-close-fly`.

Retro values of the **page** are not tokens: they live in the layer files and disappear with them. The **decorations'** own CSS (nav bar, marquee, counter, note) uses literal retro colours too (same exception as `layers/`).

## Texts (EN only, verbatim)

**Decorations and layers:**
- Nav: `Home` · `Resume` · `My Apps` · `Books` · `Guestbook` · `Links`
- Marquee: `*** Welcome to my homepage! *** Senior Android Engineer *** Creating Android apps since 2012 *** Please sign my guestbook! ***`
- Note: `Oh, snap!` / `Some pictures didn't load. Try pressing F5... or just wait a minute.`
- Contact labels (`contact-labels`): `E-mail me:` · `Phone:`
- Footer: `UNDER CONSTRUCTION` (in the SVG) · `You are visitor number 004271` · `[ << Prev | Android Devs Webring | Next >> ]` · `Last updated: 14.03.2002 · © 2002 Andrew Panasiuk. All rights reserved.`
- Browser tab title during the show: `Andrew Panasiuk - Homepage` (today's title comes back at the end).

**Tone** (GRA-58; every agent line, scripted or LLM): calm and professional, like a senior engineer narrating a migration to a client. Brief: one sentence, two at most. Respect the legacy: name the old technique neutrally ("fixed-width table layout", "system fonts of the time"), optionally why it was used; no irony, jokes, mockery, farewells to old elements, exclamation marks or emoji. Say what the step does and what the visitor gains (readability, layout, accessibility, consistency). Friendly to the visitor, never familiar. The old page's own in-world texts (Decorations and layers above) are the 2002 site itself, not the agent, and stay as they are.

**Agent chat** (the screen's `strings.ts`, except step lines, which are scenario data):
- Title `Agent` · subtitle `Fixing this site live` · minimise button label `Minimise chat` (restore: `Restore chat`) · list label (visually hidden) `Conversation with the agent` · line prefixes (visually hidden) `You:` · `Agent:` · input label (visually hidden) `Message the agent` · placeholder `Message the agent…` · send button label `Send` · meta `Answers are AI-generated and may contain mistakes.` · counter `{count} / 500`
- Intro (Round 5, the human's wording, verbatim): `That's how this CV would look like in 2001.` then `Now let's fix it.` They replace the greeting and the console hand-off line.
- Closing line: `All good now.` It replaces the finale line.
- Step narration: the fix list above (the LLM may rephrase in the same tone; these are the fallbacks). Since Round 5 it is typed into DevTools as `// …` comments, not shown in the chat. The finale fallback and the LLM's `finale` line are no longer shown (the narrate contract still carries the key).
- Scripted reply when the LLM fails (ARCHITECTURE): `Noted, thank you. Continuing with the update.`
- Limit reached (10 messages, a notice in the list): `That's the message limit for this session. The site's chat button will be available once the update is complete.` (without the IRC `***`)
- Over 500 characters (meta row, error colour): `Message too long (500 characters max).`
- Offline (banner): `You're offline. The update continues; the chat resumes when the connection is back.` (without `***`)
- Dropped with the IRC look: window title `#andrew-cv - agent chat`, status `● connected` · `2 users` · `EN`, system lines `*** Now talking in #andrew-cv` · `*** agent has joined`, placeholder `type here, press Enter`, prompt `you>`, nicks `<agent>` · `<you>`.
- Example exchange in the renders (not scripted, written in the new tone): `wow, a marquee! haven't seen one in 20 years` → `It belongs to the 2002 layout. It goes in the cleanup step, with the hit counter.` · `much better already` → `Thank you. The layout is next: a centred column and grids.`

**Steps** (manifest, scenario data): titles `fonts` · `colours` · `layout` · `images` · `cards` · `spacing & lists` · `2002 chrome` · `links & contacts`; narration fallbacks in the fix list. LLM intents (one English line each, for the narrate prompt):
- `fonts`: Replace the 2002 system fonts (Verdana, Times New Roman, Arial, Courier New) and small text sizes with today's typeface and type scale.
- `colours`: Replace the star-field background and the cream, black, red, purple and cyan colours with today's palette and gradient accents.
- `layout`: Move the page from the fixed-width, left-aligned table layout into the centred column, rows and grids.
- `images`: Correct the image paths and the aspect ratios of the app icons, and remove the "Oh, snap!" note.
- `cards`: Turn the bevelled table cells into today's skill rows, app pills and cards, with their borders, radius and colours.
- `spacing`: Remove the horizontal rules and bullet lists and restore today's section spacing.
- `chrome`: Remove the nav bar, marquee, "NEW!" bursts, hit counter, badges and webring, and bring back the meta bar with the language switcher.
- `links`: Restore the contact rows with their arrows and the footer link, and load the real AI chat button.

**Target labels** (scenario data, after `// → `; CV-90): `headings` · `page` · `name & headline` · `body text` · `skills & dates` · `experience & education` · `name & titles` · `skills` · `header` · `experience` · `apps` · `photo` · `note` · `app icons` · `Savant icon` · `book cover` · `cards` · `books` · `section titles` · `bullets` · `education & about` · `nav bar` · `NEW! badges` · `footer` · `meta bar` · `links` · `contacts`.

**DevTools console** (strings and generated text):
- Chrome (decoration, `aria-hidden`): tabs `Elements` · `Console` · `Sources`; filter bar `top` · `Filter` · `Default levels`. Panel label (visually hidden, on the section) `Developer tools: live fix console`; log label `Live fix console`.
- Opening line: `Agent connected to andrew-cv: {changes} changes in {steps} steps.` (`36`, `8` from the plan)
- Step group: `{n}/{total} {title}`; collapsed: `✓ {n}/{total} {title}`
- Target comment: `// → {label}`; commands: generated (DevTools console → Console commands); result `undefined`
- Done lines: `✓ {id} removed` (rule layer) · `✓ {id}: {count} tokens set` (token layer) · `✓ #{id} removed` (decoration) · `✓ chat button loaded` (module)
- Skipped: `{id} skipped: {reason}`
- End: `✓ All fixes applied.` (replaces `all fixes applied. Welcome to 2026.`)
- Live step announcement (visually hidden): `Step {n} of {total} done: {title}` (unchanged)
- Counters' accessible text: none (the chrome is `aria-hidden`; the step announcements carry progress)
- Plate: generated (`{tag}#{id}.{class}  {W} × {H}`, `{label} × {N}`, `body  {W} × {H}`)
- Dropped: window title `fix.exe - live console`, prompt `$ agent fix --live andrew-cv`, `// n/8 <title>`, progress `Step n of 8: <title>` and `All fixes applied`.

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
| `assets/devtools_inspect.svg` | 16 × 16 | tab strip: inspect (dashed corner box + cursor) |
| `assets/devtools_more.svg` | 16 × 16 | tab strip: `»` |
| `assets/devtools_error.svg` | 16 × 16 | error counter (filled circle, × cut out) |
| `assets/devtools_warning.svg` | 16 × 16 | warning counter, skipped row (filled triangle, ! cut out) |
| `assets/devtools_gear.svg` | 16 × 16 | tab strip: settings |
| `assets/devtools_kebab.svg` | 16 × 16 | tab strip: more options |
| `assets/devtools_clear.svg` | 16 × 16 | filter bar: clear console |
| `assets/devtools_eye.svg` | 16 × 16 | filter bar: live expression |
| `assets/devtools_triangle.svg` | 16 × 16 (shown at 12 in the selects) | `top ▾`, `Default levels ▾`, group disclosure (rotated −90° when collapsed) |
| `assets/devtools_prompt.svg` | 16 × 16 | console prompt `›` |
| `assets/devtools_result.svg` | 16 × 16 | return value `<·` |
| `assets/retro_icon_chevron.svg` | 24 × 24 (shown at 20) | agent chat: minimise / restore |

The DevTools and chevron icons (GRA-54) are single-colour vectors drawn for this package after Chrome's icon shapes, not copied: `currentColor` (the cut-outs are SVG masks), so they tint in code like the site's chat icons. The chat card also uses the site's `src/screens/chat/assets/chat_icon_sparkle.svg` and `chat_icon_send.svg` (and the launcher its `chat_icon_chat.svg`).

Fonts: Inter (shipped). The console font is the system monospace (`--devtools-code-font`: Menlo on macOS, Consolas on Windows; nothing shipped). Courier New is no longer used by the panels (GRA-54). Retro faces are system fonts and are **not** shipped (Comic Sans MS may not be redistributed); fallbacks: `'Comic Neue'` (OFL, only if Linux parity is wanted) then `cursive`; Verdana → `Geneva, sans-serif`; Times New Roman → `Times, serif`; Courier New → `Courier, monospace`.

## States and behaviour

- **Minimise** (the agent chat only, GRA-54): collapses the card to its header; the console gains the space; the button or the header restores. The show keeps running. DevTools has no window controls.
- **Scrolling**: the page scrolls under the fixed dock; the show scrolls to out-of-view targets unless the visitor scrolled in the last 4 s (Show what changed → Scrolling).
- **Visitor typing / reply streaming**: holds the next chunk at chunk boundaries only (ARCHITECTURE → Holds): a chunk that started always finishes as shown; the chat keeps working while the console types.
- **Loading**: the broken page is visible at first paint (layers injected before the first render); no flash of today's design.
- **Failures**: a chunk that fails prints a console.warn row `{id} skipped: {reason}` and the show continues after its beat; with the LLM off, narration and replies are the scripted lines.
- **Hover/focus**: DevTools chrome has none (decoration, not focusable). The chat's minimise and Send buttons and the field follow the site's chat (hover fills, focus ring `:focus-visible`).
- **Accessibility**: chat list `role="log"` `aria-live="polite"`; console `role="log"` with `aria-live="off"` and `aria-label="Live fix console"`, plus a visually hidden live line per finished step (`Step 1 of 8 done: fonts`), not per chunk (36 announcements would flood a screen reader); the DevTools chrome, counters, decorations, highlight and plate are `aria-hidden` (the round-1 `role="progressbar"` goes with the progress row). Focus is never moved by the show; the show's scroll never fights the visitor's. Contrast (WCAG): on white `--devtools-text` 16.5, `--devtools-text-dim` 6.0 (5.6 on the tab strip, 5.2 on the filter field), keyword 6.6, string 6.0, comment 6.3, number 10.8, success 5.0, plate tag 8.6, plate class 12.1; active tab `--devtools-accent` on the tab strip 5.9; warning row text 9.3. The counter icons are paired with their numbers (error icon 4.2:1; the warning icon is 2.1:1 on the strip, like Chrome's, and carries no information the number doesn't). The chat's pairs are the site chat's (`docs/design/chat/SPEC.md` → Accessibility). Text under the highlight stays readable: the content tint is .35 (.6 for 100–300 ms at the apply). Retro page pairs on `#FFFFCC`: `#CC0000` 5.7, `#008000` 5.0, `#0000EE` 9.1, `#800080` 9.2; one known short-lived miss: "remotely" `#808080` on `#FFFFCC` is 3.8:1 (gone at chunk 8). The 11 px body text lasts until chunk 4.

## Data

- CV content: unchanged, from `CvRepository`.
- Scenario: step ids, titles, intents, narration fallbacks and finale (manifest, `src/data/retro/scenario.ts`); per step its chunks in order (`src/screens/retro/scenario.ts`): the effect, the target (label + selectors, or `page`, or none) and the motion (`fade` / `morph`; decorations always leave, modules have none). The fix list above is that data.
- Which images break and which squash is layer content (`broken-photo`, `squashed-icons`, `broken-icon`, `broken-cover`). The counter number is fixed text.

## Shared components (GRA-54)

The agent chat is the site's chat panel, but `src/screens/chat/` is another screen and **a screen may not import another screen** (AGENTS.md → boundaries, enforced by lint). The project rule for a piece two screens need is to move it to `src/shared` in a Theme-zone PR, not to copy it (AGENTS.md → DRY). Proposal (Decision 39), as a prep task before R17:

| Piece today (`src/screens/chat/`) | The show uses it for | Proposal |
|---|---|---|
| `ChatIcon` + `assets/chat_icon_*.svg` | badge sparkle, Send arrow (and the launcher keeps its own) | **move** to `src/shared/chat/` |
| `MessageRow` + its CSS | agent cards and visitor bubbles | **move**; the visually hidden `You:` / `Assistant:` prefixes become props (today it reads `chatStrings`) |
| `NoticeRow` | the limit notice (tone `neutral`, no action) | **move** with `MessageRow` |
| `StreamingCaret`, `TypingIndicator` | streaming lines, waiting for a reply | **move** (stateless) |
| `SendButton` | Send (the show never shows Stop) | **move**; labels as props |
| `OfflineNotice` | offline banner | **move**; text as a prop |
| panel frame (`ChatPanel.module.css`: card, gradient border, shadow) and header layout (`ChatHeader.module.css`) | the card and its header | **extract** a stateless `ChatCard` (frame) and `ChatCardHeader` (badge, title, subtitle, one trailing action) into `src/shared/chat/`; the site passes its close button, the show its minimise |
| `chat.module.css` (`caption`, `srOnly`, `iconButton`) | meta row, prefixes, minimise button | **move** to shared CSS |
| screen-local values in `ChatScreen.module.css` (`--chat-badge-size` 36px, `--chat-ai-border-width` 1.5px) | badge, gradient border | **promote** to `tokens.css` (two screens read them) |
| `ChatComposer` | field + Send + meta | **show-local** `AgentComposer` built from the shared `SendButton` and CSS: its behaviour differs (no Stop, 3-line growth, limit and closing states, show strings). Generalise later if the two converge |
| `ChatLauncher` | the end of the show | not imported: the module chunk loads the real chat (`import('./chat')`); the show only animates its own card onto the launcher's box |

Alternative if the orchestrator prefers no change to the site chat now: show-local copies of the same pieces in `src/screens/retro/chat/` (faster, but two copies to restyle when the site's chat is calmed down).

## Screenshot vs reference

| What | Reference screenshot (`ref/`) | This spec | Why |
|---|---|---|---|
| DevTools accent | pink custom Chrome theme (`#854B66` tab, `#E9C3C5` selection) | Chrome's default light theme, accent `#0B57D0` | the brief asks for a blue underline and a blue prompt |
| Panel content | Elements tab, Styles pane, drawer with *AI assistance* | Console tab only, filter bar, messages | the show's panel is the Console |
| Overlay alpha | Chrome's (`.55`–`.66`) | about half (`.3`–`.4`) | the human asked for a lighter blue |
| Plate | `body 971×735`, no spaces | `body  880 × 800`, spaces around `×` | the brief's format; easier to read at 12 px |

## Mock vs the real site

| Mock | Real site |
|---|---|
| CSS classes stand in for the CSS Modules (layers never select them); the plate shows them (`div.card`) | hashed Module classes, shown with the hash stripped |
| Inter from Google Fonts | self-hosted `@fontsource` |
| Round-4 tokens declared in the mock's `<style>`; the token shield skips `--retro-*` | tokens in `tokens.css`; the shield re-declares every site token |
| Decorations placed by a small `place()` after layout | the retro screen's portal; same anchors |
| Layers read with XHR to generate the commands and the token values | `?raw` imports; live values from the stylesheet |
| Highlight drawn statically for the chosen state (`typing` = overlay, `applied` = with the content flash) | fades in and out with the chunk; follows moving targets |
| `closing` is one hand-placed frame | the animation in End of the show |
| No motion (renders use reduced motion) | fade, morph, leave, entrance, close as specified |

## Show case button (R24, CV-91)

The visitor starts the show with a **"Show case"** text control in the Forest meta bar on `/`, at the right end **before the language switcher** (`docs/design/forest/SPEC.md` → Structure 1). Look: the meta bar's text controls (Mono, `--forest-ink-2`; hover `--forest-accent-hover`, focus ring per Forest Interactions), a small `▶` glyph before the label. Shown only where the show can run: locale `en` and `min-width: 1024px`; otherwise absent (no disabled state). Click calls the shell's start seam (`useShowCase().start`); once the show has ended it can be clicked again (replay). While the show runs the stage covers it.

**CV-95:** the same control, same look and place, also on **`/new`**: at the right end of its meta bar, after `Open to roles` and before the language switcher (2001 `/new` → Show case button). On `/` nothing changes visually. Was "Not on `/new`" (Decision 45).

## Decisions (defaults taken; the orchestrator may change them)

1. **Direction**: 2002 FrontPage/GeoCities homepage: one era, one look.
2. **Panels**: Win98 windows with black terminals (IRC log in the chat, diffs in the console), not a bare green-on-black terminal. Same era as the page; clearer structure. **Superseded by GRA-54** (see 23–40).
3. **The windows stay retro** until they close at the end. **Superseded by GRA-54** (see 23–40).
4. **POC = the architecture's 3 steps**; superseded by the atomic list (decision 12).
5. **Each effect applies when its own text is typed** (the runner does); GRA-49 adds that each effect is typed **on its own clock** with a beat after it (decision 13).
6. **The dock reserves its width** (the page lays out in viewport − 416 px) instead of overlapping the page. **Superseded by GRA-54** (see 23–40).
7. **No alt text on broken images** (icon + box only), following the architecture.
8. **Decorations anchor to hooks** and never cover CV text; the note moves from the margin to the photo corner when the page frame is fixed.
9. **Minimise** is the only window control; no close (no skip in scope). **Superseded by GRA-54** (see 23–40).
10. **Broken images**: 3 (photo, Savant, Siddhartha); every experience logo squashed (GRA-49; was 4 with Transcenda broken). On Forest (CV-90) the app icons are squashed instead: Forest shows no company logos.
11. **Jokes stay in the furniture**; CV text is never altered or mocked.
12. **Atomic chunks** (GRA-49): one layer, decoration or module per chunk; one concern, one place; ≤ 8 code lines where possible, 9–13 for a few one-place concerns (header layout, technology cells, the bursts). 32 layer files replace the 12.
13. **Chunk rhythm**: type at 240 chars/s clamped to 0.4–1.3 s, apply at the last character, 1 s beat; narration 0.6 s ahead of a step's first chunk.
14. **8 steps**: *fonts & colours* is split into *fonts* and *colours* (it would carry 10 chunks under one narration line); the other six steps keep their titles and narration.
15. **Fade or morph per chunk**: CSS transitions (450 ms) for interpolable changes; a same-document View Transition (500 ms cross-fade, targets morph) for font family, reflow, `display`, background images and broken images; instant where View Transitions are missing.
16. **Highlight = the agent's own**: a Paint-style selection (black dashes on the console green, 3 px, 4 px out), show-owned, not the page agent's `--agent-highlight-*` outline (its colour is overridden by the damage and it marks one element). **Superseded by GRA-54** (see 23–40).
17. **Highlight timing**: on when the chunk starts typing, fill flash at the apply, gone 1 s after the apply.
18. **Page-wide chunks** get a frame around the page area instead of a rectangle, and never scroll. **Superseded by GRA-54** (see 23–40).
19. **Scrolling**: only when the first target is out of view, smooth, landing 24 px below the top; never within 4 s of the visitor's own scrolling.
20. **The console names the target** (`// → header`); no labels on the page. (GRA-54: still true; the label is a DevTools comment and the plate names the element.)
21. **Windows close smoothly**: Win98 minimise-to-taskbar feel (collapse, then shrink away to the bottom-right), console first, chat 100 ms later, 650 ms in all, with the page re-centring from 250 ms; reduced motion: instant. The close delay after the finale drops from 4 s to 3 s (budget). **Superseded by GRA-54** (see 23–40).
22. **Terminal font stays Courier New** (what renders today); `--retro-term-font` drops IBM Plex Mono, which was never shipped. **Superseded by GRA-54** (see 23–40).
23. **Agent chat = the site's AI chat panel** (GRA-54): title `Agent`, subtitle `Fixing this site live`, agent cards left, visitor navy bubbles right, composer with the round Send; no timestamps, nicks or system lines; minimise kept, no close.
24. **Token shield**: the dock root re-declares the site's tokens with their live values, so the damage token layers on `:root` never restyle the chat card.
25. **DevTools runs the full height**, flush top/right/bottom with a 1 px left border; the chat card floats over its lower part (16 px inset), and the console keeps its rows above the card with bottom padding.
26. **Tabs at 400 px**: `Elements` · `Console` · `Sources` · `»`; *Network* and *Performance* go behind `»` as in Chrome at this width (all five tabs, the counters, gear and kebab need ≈ 500 px). The device-toolbar icon is dropped for room; the inspect icon stays. Alternative: a 500 px dock (the page area, 780 px, still fits the 672 px column).
27. **Counters replace the progress row**: ✖ = chunks not done (36 → 0), ⚠ = steps not done (8 → 0). The step label is the open console group's title; the percentage is gone; no extra `console.info` lines.
28. **Counters at 0 stay visible** as grey `0` (Chrome hides them) so the finale reads "no errors, no warnings".
29. **Minimise** only on the agent chat (chevron button, collapses to the header); DevTools has no window controls.
30. **Limits use the site chat's patterns**: over 500 characters → counter + error meta text, Send disabled; 10 messages → a neutral notice in the list and a disabled field.
31. **A skipped chunk** prints a `console.warn` row and still counts as done for ✖; ⚠ counts steps only.
32. **The console prints commands, not the layer files**: rule layer → `document.querySelector('style[data-retro-layer="<id>"]').remove()`; token layer → `const { style } = document.documentElement` + one `style.setProperty` per token with the live value (the engine sets those inline properties, drops the inert layer, and the shell clears them at `done`); decoration → `document.getElementById('<id>').remove()`; module → `const { ChatRoute } = await import('./chat')`. Every result is `undefined`. The real attribute `data-retro-layer` is used (the brief's `data-layer` was an example).
33. **Typing 100 chars/s, clamped 0.6–1.3 s** (was 240 chars/s, 0.4–1.3 s), so commands read as typing and the show stays ≈ 91 s.
34. **Highlight = Chrome's box model, lighter**: content `.35`, padding `.3`, border `.4`, margin `.3` (Chrome `.55`–`.66`); the content flashes to `.6` at the apply; no dashed ring, no offset.
35. **Plate**: bottom-left corner of the chunk's first target (GRA-88; clamped into the page area; page-wide chunks and decorations: page-area corner / own box); the first match's `tag#id.class` (CSS Module hash stripped) and its live `W × H`; several matches `<label> × N` (all matches on the page), no size; page-wide → `body` + the page area's size.
36. **Page-wide chunks tint the page area** (`.2`, flashing to `.35`) with the `body` plate; no box model.
37. **End of the show**: DevTools slides right (0–300 ms), the chat shrinks into the launcher's box (150–650 ms), the reserve is released over 0–400 ms; 650 ms in all (`closingMs` unchanged); reduced motion: instant.
38. **Where the site has no colour role, Chrome's default light theme** (blue accent), not the pink custom theme of the reference screenshot.
39. **Shared chat pieces move to `src/shared/chat/`** in a prep task (Shared components); the composer stays show-local.
40. **DevTools appears instantly** at the console hand-off (as when DevTools opens); the chat card enters with the site panel's open motion at 3 s. (Round 5: at 1 s, and DevTools after the two intro lines.)
41. **Round 5 (GRA-87), the human's flow:** the show starts only on request (`?retro=1` or the shell's start function for the Show case button); the Q2/Q3 auto-start and once-per-session rules go. From today's site the chunk loads first, then the page scrolls to the top and turns broken in one frame.
42. **Intro in the chat:** broken page alone 1 s → the chat opens and streams `That's how this CV would look like in 2001.` → 1 s → `Now let's fix it.` → 0.8 s → DevTools docks → 0.8 s → step 1. Texts verbatim from the human.
43. **Silent chat while fixing:** the step narration (LLM line or fallback, contract unchanged) is typed into DevTools as `// …` comments wrapped at 52 characters, at the code rate (100 chars/s, clamped 0.6–2 s), then 0.6 s to read; the first chunk continues in the same prompt, so the comment is part of its echo. Comments change nothing, so code shown = code applied holds. Visitor replies still appear in the chat.
44. **Close sequence:** `✓ All fixes applied.` → 1 s → DevTools collapses (300 ms slide, the page re-centres over 400 ms) → 1 s → `All good now.` → 2 s → the chat collapses into the launcher (500 ms; was 650 ms with DevTools). Reduced motion: same order and pauses, no motion. The finale line goes; the LLM's `finale` narration is still requested but not shown (dropping it is a contract change for a later task).
45. **Show case button (CV-91):** a meta bar text control on `/` (en, ≥ 1024 px), before the language switcher, calls the shell's `start`; hidden otherwise, not on `/new` (**superseded by Decision 53**: on `/new` too). No hover prefetch of the show chunk (R20 exposes none).
46. **Forest refit (CV-90):** the broken page is the same 2002 homepage drawn over the Forest `/`: 32 layers on Forest hooks and `--forest-*` tokens, same steps, chunk count and step ids (`retro-3`), three layers renamed for what they now hold (`squashed-icons`, `card-padding`, `hide-meta-bar`). Every layer changes something visible on Forest; no-op rules from R22 (the job-head grid, the skills `::before`, shadows Forest doesn't have, `--forest-gold` (read only by the chat send button, which it turned yellow), the title line height) are gone.
47. **Headline:** Forest's 84 px hero h1 is the 2002 page's small bold Verdana line under the purple name (`type-scale-headings`), so the fonts step grows it back; the purple Times name keeps the 2002 hierarchy.
48. **Gradient text** (the headline's `.`, *AI Tools*, the CTA's ↗) is flat in the text colour while `heading-colors` is on: gradient text did not exist in 2002. It returns in the colours step.
49. **Education and About** are plain table areas (transparent fills from `card-colors`, no padding from `card-padding`); the sage and sand cards come back in the cards and spacing steps.
50. **Meta bar:** `hide-meta-bar` hides the whole Forest meta bar (handle, Show case button, language switcher) until the chrome step; a Show case click after it returns is a no-op while the show runs (`useShowCase.start`).
51. **Contacts** sit in centred inline blocks while `header-layout` is on (one 2002 line where it fits, two at 640 px), blue and labelled until the links step; Forest's contact rows come back in steps 3 and 8.
52. **Guard 1:** `flex-direction`, `flex-wrap` and `width` count as structural (they can't interpolate to Forest's layout), so `page-frame` and `header-layout` morph.

---

# 2001 `/new` (CV-95)

The Show case on **`/new`**, the Forest profile (`docs/design/forest/SPEC.md` → Structure `/new`). The same show as on `/` (same panels, flow, copy, timing model, highlight, plate, close; everything above that this part doesn't override), drawn over `/new`'s own markup and tokens, so its end state is the real `/new` with zero layers. How the show picks this scenario is `docs/retro/ARCHITECTURE.md` §10.

## Source (`/new`)

- **No reference from the human** (scope default l): this part defines the look. Same direction as `/` (Decision 1): the page is `/new` as its author would have built it as a 2001 FrontPage/GeoCities homepage, with today's content unchanged (Decision 11); `/new`'s own blocks (impact figures, the "How I build" panel, the Earlier row, the "Live AI CV" contact) get their 2001 equivalents (Decision 55).
- `new/layers/*.css`: the **15 `/new`-only damage layers** (the build copies them to `src/screens/retro/layers/new/`, Prettier-formatted as they will be there). The other **17 layers are `/`'s files, reused unchanged** from `src/screens/retro/layers/` (Damage layers below says which).
- `new/screenshot.png` (1280 × 800) and `new/screenshot-full.png` (1280 wide, full page): t = 0, the broken page alone, no dock. Rendered by `new/render.mjs` from the **real built `/new`**: it puts the stage on the shell's wrapper, injects the 32 layers of this scenario and the three decorations with the `/new` copy, and **fails if any layer selector matches nothing on today's `/new`** (a one-off guard 2). Run from the repo root: `npm run build && npx vite preview --port 4391 --strictPort &`, then `node docs/design/retro/new/render.mjs`. Reduced motion (marquee and bursts hold still); render on macOS or Windows (retro core fonts). The mock decorations are placed like `useDecorationPlacement` with the anchors below.

## Flow, layout and copy (`/new`)

Unchanged from `/`, verbatim: the trigger (the Show case button, `?retro=1` on `/new`, scope default j), Screen layout (dock 400 px, page area 880 px, chat card 368 × 392), Timeline and Round 5 phases, the intro lines `That's how this CV would look like in 2001.` and `Now let's fix it.`, the silent chat while fixing (narration only as `//` comments in DevTools), the close (`✓ All fixes applied.` → DevTools collapses → `All good now.` → the chat collapses into the launcher), Agent chat panel, DevTools console (chrome, rows, opening line `Agent connected to andrew-cv: 36 changes in 8 steps.`, counters ✖ 36 → 0, ⚠ 8 → 0), Console commands, Chunk rhythm, Transitions, Highlight, **Plate** (bottom-left corner of the chunk's first target; page-wide chunks at the page area's corner; decorations on their own box), Scrolling, End of the show, Tokens, Assets, States, reduced motion, EN only and desktop only (scope default e). The browser tab title during the show is the same `Andrew Panasiuk - Homepage`.

During the show the meta bar (`andrew.panasiuk / cv`, `Wroclaw area`, `Remote / B2B across EU`, `Open to roles`, Show case, switcher) is hidden by `hide-meta-bar` and comes back in the chrome step, as on `/`. The AI chat launcher is off the page until the last chunk loads it.

## Per section: what the visitor sees (`/new`, all layers on)

| Section | Broken (2001) |
|---|---|
| Frame | star tile; a cream 640 px table with an outset grey border at x = 8, y = 8; nav bar (`Home` `Resume` `Impact` `My Apps` `Guestbook` `Links`) and the Comic Sans marquee at its top; no meta bar |
| Hero | broken photo box (148 × 148) on the left; purple Times name, bold Verdana headline `AI Product Engineer.` at 15 px with "Product" and the "." flat in the text colour (no gradient), green subtitle `Mobile & Agentic Systems`, all centred beside the photo; Forest's 2 px rule in blue |
| Lead and contacts | the summary as one Verdana 12/16 paragraph (no bullet: it is a single paragraph on `/new`); under it a bold centred `Contact me:` over the three contacts as centred inline blue underlined links (email, phone, `Live AI CV — ask it anything`), no ↗ |
| 01 — Selected impact | red Times title with a groove rule and a blinking "NEW!"; the four figures as a **2 × 2 table** of bevelled grey cells (`#C0C0C0`, `2px outset`, square, 2 px apart), figures in bold Verdana 22 px, text 11 px green; the featured first cell **flat navy** `#000080` with cream text (no gradient in 2001) |
| 02 — How I build with agents | red Times title with a groove rule and a "NEW!"; the dark panel as a **black box with a grey ridge border**, square corners, no shadow: the lead in green `#00FF00` Verdana 13/17, the six steps as a **decimal list** `1.`–`6.` in green (Forest's `01`–`06` hidden, the step tiles gone), the footnote in `#00CC00` Courier New |
| 03 — Experience | red Times title; each job as a block: company in Times 13, role in green and period in grey Courier stacked over **square** bullets (Forest's "—" hidden); grey rules between jobs; the Earlier row in green; the app pills as green `#CCFFCC` boxes with a black border, icons squashed to 64 × 28 |
| 04 — Skills | red Times title centred; six bevelled cells (`2px inset #C0C0C0`) in **3 columns** 2 px apart, Arial titles, green items |
| 05 — Education, 06 — About me | plain table areas: no sage or sand fill, no card padding, each under its red title and groove rule; the three book covers "don't load" (white boxes, inset outline, broken-image icon, square) |
| Footer | blue 2 px rule; `Let's build something ↗` as a 13 px blue underlined link, the © in grey Courier at the right; then the construction sign, `You are visitor number 004271`, the two badges, `[ << Prev | AI Builders Webring | Next >> ]`, `Last updated: 14.03.2002 · © 2002 Andrew Panasiuk. All rights reserved.` |
| Margin | the "Oh, snap!" note right of the table |

## Damage layers (`/new`)

32 layers, one per chunk, the same rules as `/`'s (one concern in one place, no two layers set the same property on the same element, only hooks, retro literals only in layer files). **Shared** = `/`'s file in `src/screens/retro/layers/`, used by both scenarios unchanged (guard 2 checks it against both pages); **`/new`** = a file in `new/layers/` → `src/screens/retro/layers/new/<id>.css`. A `/new` file may carry the same id as a `/` file with different content (`heading-colors`, `page-frame`, `heading-rules`, `bullets`, `card-padding`, `new-bursts`, `decor-room`, `contact-labels`): ids are unique per scenario, and only one scenario runs at a time.

| Layer | File | Holds on `/new` (retro → Forest) |
|---|---|---|
| `type-faces` | shared | name, `h2`, `h3` (companies, Earlier, skills, degree) in Times New Roman bold; skill titles in Arial |
| `type-family` | shared | `--forest-font-display`/`-text` Verdana, `-mono` Courier New, h1 letter spacing normal |
| `type-scale-headings` | shared | name 34, headline 15/18, subtitle 13, section labels 24 |
| `type-scale-text` | shared | summary 12/16, body (bullets, education and about text) 11/15 |
| `type-scale-impact` | `/new` | `--forest-type-impact-size` 22px, impact letter spacing normal, `--forest-type-card-size` 11px (impact text, loop steps), `--forest-type-dark-lead-size` 13px, `--forest-type-dark-lead-line-height` 17px |
| `type-scale-cards` | shared | skill title 12, items 11/14, periods 11 |
| `type-scale-details` | shared | company and degree titles 13, roles 11, footer CTA 13 |
| `page-background` | shared | `body` `#000033` + star tile, `main` `#FFFFCC` |
| `base-colors` | shared | `--forest-bg` `#FFFFCC`, ink `#000000`, ink-2 `#008000`, ink-3 `#808080` |
| `heading-colors` | `/new` | name `#800080`, `h2` `#CC0000`, gradient text flat: `:is(h1, footer a) > span` (the headline's *Product* and `.`, the CTA's ↗). `/`'s file also names `h3 > span` (its gradient skill title), which `/new` doesn't have |
| `panel-colors` | `/new` | `--forest-gradient-hero` `#000080` (featured impact cell), `--forest-gradient-dark` `#000000` (loop panel), `--forest-dark-ink` `#00FF00`, `--forest-dark-ink-2` `#00CC00`, `--forest-dark-line` `#008000`, `--forest-gold-soft` `#FFFF00`, `--forest-shadow-dark` `none` |
| `page-frame` | `/new` | stage padding 8, `main` 640 px with 6 px padding and `3px outset #C0C0C0`, `[data-testid='profile']` without side padding (`/`'s names `cv`) |
| `header-layout` | shared | hero: photo left of the centred text, no wrap; contacts in centred inline blocks |
| `impact-grid` | `/new` | the impact list in 2 equal columns 2 px apart; cells without Forest's 200 px minimum height |
| `experience-heads` | shared | job rows as blocks: company, role, period stacked over the bullets |
| `skills-grid` | `/new` | skills in 3 equal columns 2 px apart, *Skills* title centred (`/`'s `tech-grid` finds its title by `data-agent-id`, which `/new` doesn't have) |
| `broken-photo` | shared | photo "doesn't load": white box, inset outline, broken-image icon, square |
| `squashed-icons` | shared | app icons 64 × 28, `object-fit: fill`, square |
| `broken-covers` | `/new` | **all three** book covers "don't load" (white box, inset outline, broken-image icon), square |
| `impact-cells` | `/new` | impact cells: padding 6, `2px outset #C0C0C0`, square, 4 px gap between figure and text |
| `loop-frame` | `/new` | the loop panel: padding 8, `3px ridge #808080`, square, 8 px gaps; steps without tile border, padding or radius |
| `app-cells` | shared | app pills as `#CCFFCC` boxes, `1px solid #000`, square, padding 4 |
| `tech-cells` | shared | skill rows as bevelled cells: `2px inset #C0C0C0`, padding 4, 2 px title gap |
| `card-colors` | shared | `--forest-line` `#808080`, `--forest-accent` `#0000FF`, `--forest-surface` `#C0C0C0` (impact cells, pills), Education/About fills transparent |
| `heading-rules` | `/new` | `[data-testid='profile']` sections 16 px apart (Forest's 48–88), `h2` margins 16/8 and a `2px groove` rule |
| `bullets` | `/new` | the loop steps' list as a block with decimal items (step numbers hidden), job bullets as square items (Forest's "—" hidden), 28 px indent |
| `card-padding` | `/new` | `profile-education` and `profile-about` without their 24 px card padding |
| `new-bursts` | `/new` | blinking "NEW!" after the *Selected impact* and *How I build with agents* titles |
| `decor-room` | `/new` | `[data-testid='profile']` 72 px top and 216 px bottom padding for the nav bar and footer |
| `hide-meta-bar` | shared | the meta bar hidden |
| `link-style` | shared | contact rows and the footer CTA `#0000EE` underlined; the contact ↗ hidden |
| `contact-labels` | `/new` | a bold `Contact me:` line before the contact list (`/`'s file labels the email and phone rows by `data-agent-id`, which `/new` doesn't have) |

**Hooks.** Every selector exists on today's `/new` (`render.mjs` checks them): section test ids (`profile`, `profile-header`, `profile-impact`, `profile-loop`, `profile-experience`, `profile-skills`, `profile-education`, `profile-about`, `src/screens/profile/testIds.ts`), Forest item test ids (`forest-meta-bar`, `forest-hero`, `forest-name`, `forest-headline`, `forest-photo`, `forest-lead`, `forest-contact`, `forest-impact-card`, `forest-loop-step`, `forest-job`, `forest-app`, `forest-skill`, `forest-book`, `src/shared/forest/testIds.ts`), element types, `:has(…)` on a hook, a hook's direct child (`[data-testid='profile-loop'] > div`, the loop panel), `[aria-hidden='true']`, `:is()`, `::before`/`::after`. **No hook has to be added** and no `data-agent-id` is used (`/new` has none today; CV-94 may add them for the chat, and the show doesn't depend on them). Not reached on purpose: the meta bar's status dot colour (hidden anyway), the app pills' meta stats, the Earlier row's flex layout (it wraps at 640 px by itself).

Host variables and keyframes: as on `/` (`--retro-broken-image`, `--retro-tile-stars`, `--retro-badge-new`, `@keyframes retro-blink`).

## Decorations (`/new`)

The same three decorations with the same look and leave motion as on `/`; only their anchors and some copy differ.

| Id | Anchor on `/new` | Copy that differs from `/` | Removed by |
|---|---|---|---|
| `top-bar` | top-left of `[data-testid='profile']`, its full width | nav `Home` · `Resume` · `Impact` · `My Apps` · `Guestbook` · `Links` (`Books` → `Impact`); marquee `*** Welcome to my homepage! *** AI Product Engineer *** Mobile & Agentic Systems *** Please sign my guestbook! ***` (`/new`'s own headline and subtitle) | chunk 29 |
| `page-footer` | bottom of `[data-testid='profile']`, its full width, top edge 200 px above the bottom | webring `AI Builders Webring` (was `Android Devs Webring`); the sign, counter `004271`, badges and the last-updated line are `/`'s | chunk 31 |
| `oh-snap` | while `page-frame` is on: 28 px right of `main`, 40 px below the top of `[data-testid='profile-header']`; after: over the photo's top-right corner (`forest-photo`), as on `/` | none | chunk 18 |

## The fix list (`/new`)

8 steps of 36 chunks: 32 layers (17 morph, 15 fade), 3 decorations (leave), 1 module. Step ids and titles are `/`'s (`fonts`, `colours`, `layout`, `images`, `cards`, `spacing`, `chrome`, `links`; titles `fonts` · `colours` · `layout` · `images` · `cards` · `spacing & lists` · `2002 chrome` · `links & contacts`); narration fallbacks and LLM intents follow `/new`'s content (Texts below). Columns as in `/`'s fix list; **Chars** counts the typed input with the token layers' full `setProperty` lines and today's values; **s** = typing (100 chars/s, 0.6–1.3 s) + 1 s beat. Selectors are hooks under `[data-retro-stage]`.

**Step 1 · `fonts`** · narration: *Starting with typography: the current typeface and type scale, so the headline and the impact figures read at a glance.*

| # | Chunk | Chars | Holds (retro) → Forest | Target | Motion | s |
|---|---|---|---|---|---|---|
| 1 | `type-faces` | 85 | Times New Roman headings, Arial skill titles → Onest | headings: `[data-testid='forest-name']`, `h2` | morph | 1.9 |
| 2 | `type-family` | 454 | Verdana, Courier New → Onest, IBM Plex Sans, JetBrains Mono, −0.045em | page | morph | 2.3 |
| 3 | `type-scale-headings` | 394 | name 34, headline 15/18, subtitle 13, labels 24 → 19–21, 40–84 / 0.98, 19–24, 14 | name & headline: `[data-testid='forest-name']`, `[data-testid='forest-headline']`, `h2` | fade | 2.3 |
| 4 | `type-scale-text` | 301 | summary 12/16, body 11/15 → 18–20 / 1.55, 16 / 1.55 | summary: `[data-testid='forest-lead']` | fade | 2.3 |
| 5 | `type-scale-impact` | 395 | figures 22, card text 11, panel lead 13/17 → 34–44 / −0.04em, 15, 19–22 / 1.4 | impact & loop: `[data-testid='profile-impact']`, `[data-testid='profile-loop']` | fade | 2.3 |
| 6 | `type-scale-cards` | 307 | skill title 12, items 11/14, periods 11 → 16, 15 / 1.55, 13 | skills & dates: `[data-testid='profile-skills']` | fade | 2.3 |
| 7 | `type-scale-details` | 247 | company 13, role 11, footer CTA 13 → 20, 15, 28–52 | experience & education: `[data-testid='profile-experience']`, `[data-testid='profile-education']` | fade | 2.3 |

**Step 2 · `colours`** · narration: *Colours: replacing the tiled background and the period palette with the current colour scheme, including the impact and process panels.*

| # | Chunk | Chars | Holds (retro) → Forest | Target | Motion | s |
|---|---|---|---|---|---|---|
| 8 | `page-background` | 86 | star tile, cream table → plain page | page | morph | 1.9 |
| 9 | `base-colors` | 235 | cream, black, green, grey → white, forest inks | page | fade | 2.3 |
| 10 | `heading-colors` | 94 | purple name, red labels, flat *Product* and ↗ → ink, accent green, the green-gold gradient back | name & titles: `[data-testid='forest-name']`, `h2` | fade | 1.9 |
| 11 | `panel-colors` | 550 | navy featured cell, black panel with green text, yellow numbers, no shadow → the hero and dark gradients, dark-panel inks, gold-soft, the panel shadow | impact & loop: `[data-testid='forest-impact-card']`, `[data-testid='profile-loop'] > div` | morph | 2.3 |

**Step 3 · `layout`** · narration: *Layout: replacing the fixed-width table layout, standard practice at the time, with a centred column and grids.* (`/`'s line)

| # | Chunk | Chars | Holds (retro) → Forest | Target | Motion | s |
|---|---|---|---|---|---|---|
| 12 | `page-frame` | 81 | 640 px outset table at the left → the centred 1080 px column | page | morph | 1.8 |
| 13 | `header-layout` | 86 | photo left of the centred text, contacts in centred blocks → hero with the photo right, contact rows | header: `[data-testid='forest-hero']` | morph | 1.9 |
| 14 | `impact-grid` | 84 | 2 × 2 table → four figures in a row, 200 px tall | impact: `ul:has(> [data-testid='forest-impact-card'])` | morph | 1.8 |
| 15 | `experience-heads` | 93 | job heads stacked over the bullets → company / role / period beside the bullets | experience: `[data-testid='forest-job']` | morph | 1.9 |
| 16 | `skills-grid` | 84 | 3 tight columns, centred title → the skills grid | skills: `[data-testid='profile-skills']` | morph | 1.8 |

**Step 4 · `images`** · narration: *Images: correcting the asset paths and aspect ratios, so the photo, app icons and book covers display properly.*

| # | Chunk | Chars | Holds (retro) → Forest | Target | Motion | s |
|---|---|---|---|---|---|---|
| 17 | `broken-photo` | 84 | photo "doesn't load" → the round photo with its green ring | photo: `[data-testid='forest-photo']` | morph | 1.8 |
| 18 | `oh-snap` (decoration) | 53 | the note → gone | note: `#oh-snap` | leave | 1.6 |
| 19 | `squashed-icons` | 90 | app icons 64 × 28, square → 36 px round icons | app icons: `[data-testid='forest-app'] img` | morph | 1.9 |
| 20 | `broken-covers` | 91 | three covers "don't load", square → the covers, radius 6 | book covers: `[data-testid='forest-book'] img` | morph | 1.9 |

**Step 5 · `cards`** · narration: *Cards: converting the bevelled table cells into impact cards, the process panel, app pills and skill rows.*

| # | Chunk | Chars | Holds (retro) → Forest | Target | Motion | s |
|---|---|---|---|---|---|---|
| 21 | `impact-cells` | 91 | bevelled square cells, padding 6 → radius 20, padding 22 | impact cards: `[data-testid='forest-impact-card']` | fade | 1.9 |
| 22 | `loop-frame` | 87 | ridge-bordered square box, plain step rows → radius 24, the step tiles with their hairline | loop panel: `[data-testid='profile-loop'] > div` | fade | 1.9 |
| 23 | `app-cells` | 80 | green boxes, black border → round pills | apps: `[data-testid='forest-app']` | fade | 1.8 |
| 24 | `tech-cells` | 83 | bevelled skill cells → rows under a 1 px line | skills: `[data-testid='forest-skill']` | fade | 1.8 |
| 25 | `card-colors` | 298 | grey line and surface, blue accent, no card fills → forest line, surface, green accent, sage and sand cards | cards: `[data-testid='forest-impact-card']`, `[data-testid='profile-education']`, `[data-testid='profile-about']` | fade | 2.3 |

**Step 6 · `spacing` · title `spacing & lists`** · narration: *Spacing: replacing the horizontal rules and numbered lists with consistent section spacing, so the page is easier to scan.*

| # | Chunk | Chars | Holds (retro) → Forest | Target | Motion | s |
|---|---|---|---|---|---|---|
| 26 | `heading-rules` | 94 | sections 16 px apart, groove rules under the titles → 48–88 px apart, no rule | section titles: `h2` | fade | 1.9 |
| 27 | `bullets` | 79 | decimal loop list, square job bullets → the six step tiles with `01`–`06`, "—" bullets | lists: `ol:has(> [data-testid='forest-loop-step'])`, `[data-testid='forest-job'] ul` | morph | 1.8 |
| 28 | `card-padding` | 96 | Education and About without padding → 24 px cards | education & about: `[data-testid='profile-education']`, `[data-testid='profile-about']` | fade | 2.0 |

**Step 7 · `chrome` · title `2002 chrome`** · narration: *Removing the navigation bar, marquee and footer badges of the original build, and restoring the meta bar.* (`/`'s line)

| # | Chunk | Chars | Holds (retro) → Forest | Target | Motion | s |
|---|---|---|---|---|---|---|
| 29 | `top-bar` (decoration) | 56 | nav bar and marquee → gone | nav bar: `#top-bar` | leave | 1.6 |
| 30 | `new-bursts` | 88 | blinking "NEW!" after two section titles → gone | NEW! badges: `[data-testid='profile-impact'] > h2`, `[data-testid='profile-loop'] > h2` | morph | 1.9 |
| 31 | `page-footer` (decoration) | 59 | construction sign, counter, badges, webring → gone | footer: `#page-footer` | leave | 1.6 |
| 32 | `decor-room` | 81 | 72 px top and 216 px bottom padding → Forest's | page | fade | 1.8 |
| 33 | `hide-meta-bar` | 88 | meta bar (handle, location, work mode, status, Show case, switcher) hidden → back | meta bar: `[data-testid='forest-meta-bar']` | morph | 1.9 |

**Step 8 · `links` · title `links & contacts`** · narration: *Finally, links: restoring the contact rows and the footer link, and loading the AI chat assistant.* (`/`'s line)

| # | Chunk | Chars | Holds (retro) → Forest | Target | Motion | s |
|---|---|---|---|---|---|---|
| 34 | `link-style` | 82 | contacts and the CTA `#0000EE` underlined, ↗ hidden → ink rows with green ↗, the ink CTA | links: `ul:has(> li > [data-testid='forest-contact'])`, `footer a` | morph | 1.8 |
| 35 | `contact-labels` | 89 | bold `Contact me:` line → gone | contacts: `ul:has(> li > [data-testid='forest-contact'])` | morph | 1.9 |
| 36 | `ai-chat` (module) | 44 | the AI chat button loads | none | none | 1.6 |

Order within a step runs down the page where it can (the camera goes header → impact → loop → experience → skills → education/about → footer in most steps); `type-scale-cards` (skills) before `type-scale-details` (experience) mirrors `/`, so the camera moves down and back once in the fonts step.

**Console commands**: generated exactly as on `/` (Console commands): e.g. chunk 11 types `// → impact & loop`, `const { style } = document.documentElement`, then seven lines such as `style.setProperty('--forest-gradient-hero', 'linear-gradient(135deg, #1f3a22, #3e7a34)')` and `style.setProperty('--forest-shadow-dark', '0 30px 80px -40px rgba(62, 122, 52, 0.5)')`, values read live; done line `✓ panel-colors: 7 tokens set`. Chunk 20 types `// → book covers` and `document.querySelector('style[data-retro-layer="broken-covers"]').remove()`, done line `✓ broken-covers removed`.

## Timing budget (`/new`)

Measured the way `showTiming.test.ts` measures `/` (fake clock: fallback narration, a camera that settles at once, token chunks typing their first two lines):

| Part | Time |
|---|---:|
| Intro (as `/`) | 5.1 s |
| 1 fonts (7 chunks) | 13.8 s |
| 2 colours (4) | 9.3 s |
| 3 layout (5) | 11.4 s |
| 4 images (4) | 9.3 s |
| 5 cards (5) | 11.1 s |
| 6 spacing & lists (3) | 7.9 s |
| 7 2002 chrome (5) | 10.8 s |
| 8 links & contacts (3) | 7.3 s |
| Close (as `/`) | 5.2 s |
| **Total** | **≈ 91 s** (91.2) |

In the browser the 9 token chunks print every `setProperty` line and hit the 1.3 s cap: ≈ 97 s (`/` ≈ 96 s). The `/new` e2e timing smoke keeps `/`'s window: done within 110 s of show time and not under 60 s. Reduced motion ≈ 78 s, as `/`.

## Texts (`/new`, EN only, verbatim)

- Same as `/`: intro and close lines, the agent chat strings, the DevTools strings and the opening line, the scripted reply, limit, too-long and offline lines, the note, the counter, the construction sign, the last-updated line, the browser tab title, step titles, the finale fallback (not shown).
- `/new` decoration copy: nav `Home` · `Resume` · `Impact` · `My Apps` · `Guestbook` · `Links`; marquee `*** Welcome to my homepage! *** AI Product Engineer *** Mobile & Agentic Systems *** Please sign my guestbook! ***`; webring `[ << Prev | AI Builders Webring | Next >> ]`.
- Layer content: `Contact me:` (`contact-labels`).
- Narration fallbacks: the fix list above (Tone as `/`: calm, professional, one sentence; the LLM may rephrase).
- **LLM intents** (manifest, one English line each, the `/new` narrate and reply outline):
  - `fonts`: Replace the 2002 system fonts (Verdana, Times New Roman, Arial, Courier New) and small sizes with today's typeface and type scale: the AI Product Engineer headline, the impact figures and the process panel.
  - `colours`: Replace the star-field background, the cream page and the flat navy and black panels with today's palette and gradients: the featured impact card and the dark "How I build with agents" panel.
  - `layout`: Move the page from the fixed-width, left-aligned table into the centred column: the hero beside the photo, the impact figures in one row, the job rows and the skills grid.
  - `images`: Correct the image paths and the app icons' aspect ratios so the photo, the app icons and the book covers load, and remove the "Oh, snap!" note.
  - `cards`: Turn the bevelled table cells into today's impact cards, the framed process panel, app pills, skill rows and the education and about cards.
  - `spacing`: Remove the horizontal rules and the numbered and square-bullet lists, and restore today's section spacing, the six loop steps as tiles and the job bullets.
  - `chrome`: Remove the nav bar, marquee, "NEW!" bursts, hit counter, badges and webring, and bring back the meta bar with location, availability and the language switcher.
  - `links`: Restore the contact rows with their arrows (email, phone, the live AI CV) and the footer link, and load the real AI chat button.
- **Target labels** (after `// → `): `headings` · `page` · `name & headline` · `summary` · `impact & loop` · `skills & dates` · `experience & education` · `name & titles` · `header` · `impact` · `experience` · `skills` · `photo` · `note` · `app icons` · `book covers` · `impact cards` · `loop panel` · `apps` · `cards` · `section titles` · `lists` · `education & about` · `nav bar` · `NEW! badges` · `footer` · `meta bar` · `links` · `contacts`.

## Show case button (`/new`)

The shared control of the section *Show case button* above, in `/new`'s meta bar: right group, after the status `● Open to roles` and before the language switcher, the meta bar's 16 px gap between items (`--space-4`, the `.right` group's gap). Same look, label `▶ Show case`, same rule (en and ≥ 1024 px, else absent), same seam. On `/` its place and look don't change.

## Accessibility (`/new`, the broken page)

As `/` (States → Accessibility). New retro pairs: `#00FF00` on `#000000` 15.3:1, `#00CC00` on `#000000` 9.6:1, `#FFFFCC` on `#000080` 15.6:1, black on `#C0C0C0` 11.5:1. Known short-lived misses: the impact text (`--forest-ink-2`) on the grey `--forest-surface` cells is 2.8:1 until `base-colors` (chunk 9, ≈ 25 s in), then 3.7:1 until `card-colors` restores the surface (chunk 25, ≈ 66 s in); the periods `#808080` on cream are 3.8:1 until chunk 9.

## Decisions (`/new`, CV-95; defaults taken, the orchestrator may change them)

53. **Show case on `/new`**: the shared meta-bar control, same look and rule as `/`, after the status and before the switcher; `?retro=1` on `/new` starts the `/new` show (scope defaults i, j).
54. **One look for both pages**: the same 2001 homepage language on `/new` (star tile, 640 px cream table, Verdana/Times/Comic, bevels, NEW!, blue links, broken images, the same decorations), so the two shows read as one series; `/new` differs only where its blocks differ.
55. **`/new`'s own blocks in 2001 terms**: impact figures → a 2 × 2 table of bevelled grey cells with the featured one flat navy; the dark "How I build" panel → a black ridge-bordered box with green text and a decimal list (a 2001 "terminal" box); the contacts → a `Contact me:` line over inline links; the "Live AI CV" row stays (content is never hidden).
56. **Reuse `/`'s layer files** where every selector already matches both pages (17 files); `/new`-only files (15) live in `layers/new/` and may share an id with a `/` file. A shared file is a two-page contract: guard 2 checks it against both pages.
57. **No new hooks**: test ids, element types and structural selectors only; no `data-agent-id` (the `/`-only per-item breakage, Savant's icon and Siddhartha's cover, becomes "all three covers don't load" on `/new`).
58. **Same step ids and titles as `/`** (`retro-3`'s eight), so the v3 contract stays as it is (ARCHITECTURE §10); the narration fallbacks for fonts, colours, images, cards and spacing name `/new`'s content, the other three are `/`'s lines.
59. **36 chunks, ≈ 91 s** on the fake clock (scope default f); trimmed from a 41-chunk draft: no separate loop-list, app-stack, skill-fill, book-frame or job-rhythm chunks (the first is part of `bullets`; the others add little at 640 px).
60. **`panel-colors` morphs**: its tokens' "after" values are gradients, which can't interpolate; guard 1 treats `--forest-gradient-*` tokens as structural (ARCHITECTURE §10 → Guards).
61. **2002 in the furniture, 2001 in the intro** on both pages, as on `/` (`2002 chrome`, `Last updated: 14.03.2002`): the narrate prompt says "original 2002 build" for both scenarios and stays unchanged.
62. **Decoration copy**: the marquee quotes `/new`'s own headline and subtitle; the nav names `/new`'s sections; the webring is `AI Builders Webring`. Nothing else differs.
63. **The intro and close are `/`'s lines verbatim** (the human's wording says "this CV" on both pages).
64. **Plate and highlight unchanged**: the plate sits on the first target's bottom-left corner; multi-target chunks list the topmost block first where the camera should go.

## v3 refit (`retro-4`, CV-112)

The show runs on the one v3 page (`docs/design/v3/`, ADR-0006) as **`retro-4`**: `/new`'s 2001 look and fix list above, on the v3 page's `home-*` hooks and v3 tokens (`docs/retro/ARCHITECTURE.md` §11). Same 32 layer ids, 36 chunks, 8 steps, decorations, flow and timing (≈ 91 s on the fake clock). The source of truth is now `src/screens/retro/layers/*.css` (the copies in `new/layers/` and `layers/` here are history).

**Selectors that moved** (`/new` → v3):

| `/new` | v3 |
|---|---|
| `[data-testid='profile']` (root, `decor-room`, `heading-rules`, `page-frame`) | `[data-testid='home']`; the page card is its direct child `[data-testid='home'] > div` (`page-frame`: no side padding, radius or shadow; `heading-rules`: the 16 px section gap) |
| `forest-hero` (`header-layout`) | `home-header` (photo row and headline centred; no `text-align`, the summary stays left) |
| `forest-name`, `forest-headline`, `forest-lead`, `forest-photo` | `home-name`, `home-headline`, `home-summary`, `home-photo` |
| `ul:has(> li > forest-contact)`, `li:has(> forest-contact)` | `div:has(> home-contact)`, `home-contact` (the buttons are inline links) |
| `footer a`, `:is(h1, footer a) > span` | `[data-testid='home-footer'] a`, `:is(home-headline, home-footer a) > span` |
| `ul:has(> forest-impact-card)`, `forest-impact-card` | `div:has(> home-impact-card)` (one column at 640 px; three cards, not four), `home-impact-card` |
| `profile-loop > div`, `ol:has(> forest-loop-step)` | `home-loop > div:has(> ol)` (the panel; the first child is now the heading), `ol:has(> home-loop-step)` |
| `:is(profile-impact, profile-loop) > h2` | `:is(home-loop, home-impact) h2` (the title sits in a heading div) |
| `forest-job`, its `div` and `li` | `home-job > div:has(> img)` (the head: logo over the text), `home-job li` (also the project bullets) |
| `forest-app`, `forest-app img` | `home-project` (the Transcenda tree), `home-project img` |
| `forest-skill`, `profile-skills h2`, `ul:has(> forest-skill)` | `home-skill`, `home-skills h2` (`align-self: center`: the title is a flex item), `div:has(> home-skill)` |
| `profile-education`, `profile-about`, `forest-book img` | `home-education`, `home-about`, `home-book` (the cover is the `img`) |
| `forest-meta-bar` | `home-meta-bar` |
| `h2` margins and groove rule (`heading-rules`) | on the heading div `section > div:has(> h2)` (full width; the footer's title is an `h2` without one) |

**Tokens** (value for value, ADR-0006 Decision 5): `type-family` `--font-sans` Verdana, `--font-mono` Courier New, `--type-h1-letter-spacing` normal; `type-scale-headings` name 34, h1 15/18, tagline 13, h2 24; `type-scale-text` summary 12/16, body 11/15, buttons 12; `type-scale-cards` stats 22 (spacing normal), card titles 13, labels 11, meta 11; `type-scale-impact` impact 22 (spacing normal), loop lead 13/17; `type-scale-details` company 13, role 11, period 11, footer title 13; `base-colors` card `#FFFFCC`, ink and ink-2 black, ink-3 `#008000` (roles, tagline, card prose: `/new`'s green secondary), ink-4 `#808080` (periods); `panel-colors` (morph: gradient tokens are structural) brand tile `#000080` (the AI stat), dark gradient `#000000`, footer gradient transparent, dark ink `#00FF00`, dark line `#008000`, step numbers `#FFFF00`, footnote `#00CC00`, dark shadow none; `card-colors` line `#808080`, accent `#0000FF`, surface, pink and lilac surfaces `#C0C0C0`, violet (education) transparent.

**v3 blocks broken by the existing layers** (no new chunk): the stat tiles (Arial in `type-faces`, bevelled in `impact-cells`, grey in `card-colors`, the AI tile navy in `panel-colors`); the craft cards (`impact-cells`, `card-colors`, 2 px apart in `impact-grid`); the project tree (green boxes in `app-cells`, squashed icons, dotted stems hidden in `bullets`); the footer (transparent in `panel-colors`, no padding in `card-padding`, its pills plain blue links in `link-style`); the contact buttons (inline in `header-layout`, plain blue links in `link-style`, `Contact me:` in `contact-labels`).

**Differences from `/new`**: the loop steps are plain rows `01 …`–`06 …` instead of a decimal list (the v3 step number is not `aria-hidden`, so it stays and numbers the rows); the fonts step runs down the page (`type-scale-cards` covers the stats and craft cards before `type-scale-impact` covers the loop and impact); the marquee quotes the v3 page (`*** Welcome to my homepage! *** Senior Software Product Engineer *** Android since 2012 *** Agentic engineering *** Please sign my guestbook! ***`, Decision 62); the photo keeps its v3 size (72–96 px). Intents and fallbacks: `src/data/retro/scenario.ts` (`/new`'s, reworded for the stats, craft cards, project tree, contact buttons and footer; no language switcher).
