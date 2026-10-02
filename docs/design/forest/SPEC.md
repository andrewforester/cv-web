# Forest: the CV site redesign

Source: Claude Design project "CV AI Product Engineer Forest" (`design.dc.html` here is the exported
file; open it in a browser next to `support.js` to see it live, it loads React from unpkg).
Exported by the orchestrator on 2026-10-02 (GRA epic *Forest Redesign + Show case*, P-GRA-8).
Renders: `screenshot.png` (1280 px wide, full page), `screenshot-mobile.png` (390 px).
Assets: `assets/` (photo, three books, three app icons; the same files as `src/screens/cv/assets/`).

This package supersedes `docs/design/cv/` as the **style reference** for the whole site: CV pages
and the chat. The old package stays as history for the content of `/`.

## Pages

| Route | Content | Built from |
|---|---|---|
| `/new` | The design's own structure and content (sections 01–06 below), EN + UK | this SPEC, 1:1 |
| `/` | Today's CV content (`src/data/mock/cv.*.json`, unchanged) in the Forest look | this SPEC → "Mapping `/`" |

Both pages share one set of Forest components (see Architecture). The AI chat floats over both.

## Tokens

Colours (names are proposals for `src/theme/tokens.css`; the Theme task fixes them):

| Token | Value | Role |
|---|---|---|
| `--forest-bg` | `#FFFFFF` | page |
| `--forest-ink` | `#15211A` | primary text |
| `--forest-ink-2` | `#52604F` | secondary text, meta bar, roles |
| `--forest-ink-3` | `#7F8A78` | periods, footer © |
| `--forest-accent` | `#3E7A34` | links, section labels, rules (2 px), photo ring, bullets "—", ↗ |
| `--forest-accent-hover` | `#A9832A` | link hover |
| `--forest-green` | `#4E9A36` | gradient start |
| `--forest-gold` | `#C49A34` | gradient end |
| `--forest-gold-soft` | `#E3C46A` | step numbers on the dark panel |
| `--forest-status` | `#15803D` | "Open to roles" text |
| `--forest-status-dot` | `#16A34A` | its 7 px dot |
| `--forest-line` | `#DCE2D2` | 1 px dividers, book border |
| `--forest-surface` | `#F1F4EC` | impact cards, app pills |
| `--forest-card-sage` | `#DFE8D0` | education card |
| `--forest-card-sand` | `#F3ECD6` | about card |
| `--forest-dark-ink` | `#EEF2E8` | text on the dark panel |
| `--forest-dark-ink-2` | `#A8B4A0` | footnote on the dark panel |
| `--forest-dark-line` | `#3A4D3F` | step borders on the dark panel |
| `--forest-gradient-text` | `linear-gradient(90deg,#4E9A36,#C49A34)` | "Product", the dots, clipped to text |
| `--forest-gradient-cta` | `linear-gradient(90deg,#3E7A34 0%,#4E9A36 65%,#C49A34 100%)` | footer ↗ |
| `--forest-gradient-hero` | `linear-gradient(135deg,#1F3A22,#3E7A34)` | first impact card (white text) |
| `--forest-gradient-dark` | `linear-gradient(150deg,#1A2B1E 0%,#0E120F 40%,#0A0B0A 100%)` | "How I build" panel |
| `--forest-shadow-dark` | `0 30px 80px -40px rgba(62,122,52,.5)` | dark panel |

Fonts (self-hosted like Inter today, latin + cyrillic):
- **Onest** 400/500/600/700: display and UI (name, h1, company names, numbers, card titles).
- **IBM Plex Sans** 400/500: reading prose (summary, bullets, skills items, education/about text).
- **JetBrains Mono** 400/500: meta bar, section labels `01 — …`, periods, step numbers, app meta,
  footnotes, ©.

Type (desktop → phone). The design's `clamp(a, calc(b + (600px - 100vw) * 100), b)` is a step:
`b` above 600 px viewport, `a` at or below it. Implement as two values switched by one
`@media (max-width: 600px)`; fluid `clamp(min, vw, max)` values stay fluid.

| Role | Font | Size | Weight / extras |
|---|---|---|---|
| h1 headline | Onest | clamp(40px, 7.4vw, 84px) | 600, lh .98, ls −.045em, `text-wrap: balance` |
| subtitle | Onest | clamp(19px, 2.2vw, 24px) | 400, ink-2, ls −.01em |
| name | Onest | clamp(19px, 2vw, 21px) | 600 |
| lead paragraph | Plex | clamp(18px, 1.7vw, 20px) | lh 1.55, `text-wrap: pretty` |
| section label | Mono | 14 → 13 | 500, accent, ls .02em |
| impact value | Onest | clamp(34px, 4vw, 44px) | 600, ls −.04em, lh 1 |
| card text | Onest | 15 → 14 | lh 1.5 |
| dark panel lead | Onest | clamp(19px, 2vw, 22px) | lh 1.4, max-width 720 |
| company / card title | Onest | 20 → 19 | 600, ls −.015em |
| role, meta | Onest | 15 → 14 | ink-2 |
| period | Mono | 13 → 12 | ink-3 |
| bullet / body | Plex | 16 → 15 | lh 1.55 |
| skills title | Onest | 16 → 15 | 600 |
| skills items | Plex | 15 → 14 | lh 1.55, ink-2 |
| meta bar | Mono | 14.5 → 13.5 | ink-2 |
| footer CTA | Onest | clamp(28px, 5vw, 52px) | 600, ls −.04em, lh 1 |

Radii: 20 (impact cards), 24 (dark panel, education, about), 16 (loop steps), 999 (app pills),
6 (books), 50% (photo, app icons, status dot).

Layout: content column max 1080 px, centred; padding `clamp(16px,4vw,48px)` top,
`clamp(16px,4vw,40px)` sides, 40 bottom; gap between sections `clamp(48px,7vw,88px)`. Rows use
flex-wrap with basis 520/260 (hero), 220/420 (job rows), grids `auto-fit minmax(min(100%,X),1fr)`
with X = 185 (impact), 115 (loop), 300 (skills), 320 (education/about). No other breakpoints.

## Structure (`/new`, top to bottom)

1. **Meta bar** (Mono, ink-2): left `andrew.panasiuk / cv`; right: `Wroclaw area`,
   `Remote / B2B across EU`, status dot + `Open to roles` (status colours).
2. **Hero:** name; h1 `AI Product Engineer.` ("Product" and "." in the text gradient); subtitle
   `Mobile & Agentic Systems`; photo 148 px circle (clamp 96–148), 1 px accent ring, bottom-aligned.
3. **Lead row** under a 2 px accent rule (padding-top 24): the summary paragraph (Plex) and the
   contacts list: email, phone, "Live AI CV — ask it anything"; each row 12 px vertical padding,
   1 px line below, label with ellipsis, accent ↗ at the right.
4. **01 — Selected impact:** 4 cards (radius 20, padding 22, min-height 200): big value, text at
   the bottom. First card on the hero gradient with white text; the others on surface.
5. **02 — How I build with agents:** the dark panel (radius 24, padding clamp 20–32, dark gradient,
   shadow): lead sentence, 6 numbered steps (`01`…`06` in gold-soft Mono, text 15), footnote
   `↺ every retro lands as a PR to the rules — the process improves itself` (Mono 13, dark-ink-2).
6. **03 — Experience:** job rows (1 px top line, padding 22 0): left company / role / period; right
   bullet list with accent "—". Then an **Earlier** row (company names inline). Then 3 app pills
   (surface, radius 999, 36 px round icon, name 600, Mono meta like `5.0★ · 91.8K · 1M+`).
7. **04 — Skills:** 2–3 column grid of title + items, 1 px top line each.
8. **05 — Education** (sage card) and **06 — About me** (sand card, three book covers 72 px wide,
   2:3, radius 6; text with books and hobbies).
9. **Footer** under a 2 px accent rule: `Let's build something ↗` (mailto, ↗ in the CTA gradient),
   `© 2026 Andrew Panasiuk` (Mono, ink-3).

All texts and data for `/new` are in `design.dc.html` (`renderVals()`: `impact`, `loop`, `jobs`,
`apps`, `skills`; the rest inline). They become data, not strings (see Architecture).

## Mapping `/` (today's content in the Forest look)

| Today's section | Forest component |
|---|---|
| header: name, headline, tagline, photo, contacts | meta bar (left `andrew.panasiuk / cv`, right only the language switcher and the status if data has it: it doesn't, so nothing), hero (name, h1 = headline with the last word not gradient-styled; a trailing gradient "."), subtitle = tagline; contacts list = email, phone, WhatsApp, Telegram rows with ↗ |
| summary (rich lines) | lead paragraph(s), emphasis as 600 weight |
| technologies (cards; `ai` variant) | **Skills** grid: title + items joined with ", "; the `ai` card's title in the text gradient; `highlighted` = title in accent |
| latest + previous experience | **Experience** job rows (bullets as rich text); company logos are not shown |
| apps | app pills after experience (meta = rating · reviews · installs as available) |
| education (lines) | **Education** sage card (first line = title, the rest = meta) |
| books + interests | **About me** sand card (book covers + interests text) |
| — | footer CTA (mailto the CV's email) |

Section labels on `/` are numbered in page order (`01 — Skills`, `02 — Experience`, …); there is no
impact section and no dark panel on `/`.

## Interactions

- Links: accent, hover gold (`--forest-accent-hover`); contact rows keep ink text, ↗ accent.
- "Live AI CV — ask it anything" opens the site's AI chat (see Decisions), not a new page.
- Focus rings: 2 px accent outline, offset 2.
- No motion beyond colour transitions (150 ms).

## Architecture (orchestrator, binding for the implementation tasks)

- **Routing:** two paths, `/` and `/new`, in-house (no router library): the app shell reads
  `location.pathname`; anything else renders `/`. `vercel.json` gets an SPA rewrite so `/new`
  serves `index.html` (keep `/api/*` untouched). Header, language switcher and chat are shared.
- **Data:** `/` keeps `Cv` and `getCv(locale)`. `/new` gets its own model `Profile` in
  `src/data/models.ts` (or `src/data/profile.ts`) and `getProfile(locale)` on the repository,
  mocked by `src/data/mock/profile.{en,uk}.json` (the design's content; UK is a translation by the
  developer). Items keep stable `id`s (agent targets), as in `Cv`.
- **Components:** the Forest building blocks (`MetaBar`, `Hero`, `ContactRows`, `SectionLabel`,
  `JobRow`, `AppPill`, `SkillsGrid`, `InfoCard` for education/about, `FooterCta`, plus `/new`-only
  `ImpactCards` and `LoopPanel`) are written once in `src/shared/forest/` and used by both
  screens. Stateless, props in.
- **Screens:** `/new` = new screen `src/screens/profile/` (the `cv` screen pattern);
  `/` = the existing `src/screens/cv/` re-composed from the shared components. Its page-agent
  targets (`data-agent-id`, section ids) stay; `/new` registers the same agent tools for its own
  sections.
- **Strings:** section labels and fixed UI words in each screen's `strings.ts` (EN + UK).
- **Retro show:** `/` is the show's end state (milestone 2 refits the damage layers to it). Keep
  section and item hooks (`data-agent-id`, section ids) on `/`.

## Decisions (orchestrator, 2026-10-02)

1. Fonts: three new `@fontsource` packages (`onest`, `ibm-plex-sans`, `jetbrains-mono`), latin +
   cyrillic, imported in `src/theme/fonts.css`; Inter is removed once nothing uses it.
2. Language switcher: at the right end of the meta bar on both pages, restyled in Forest (Mono,
   ink-2, active = ink, underline accent).
3. "Live AI CV — ask it anything" is a link to `#ask`; the chat opens when the hash becomes `#ask`
   (and clears it). On `/` the row isn't shown (the chat launcher is there anyway).
4. No navigation between `/` and `/new` (the human didn't ask for one).
5. Company logos from `docs/design/cv` are not used in Forest.
6. Phone breakpoint for stepped sizes: 600 px (from the design).
7. The headline variants (`AI Product Engineer` / `Product Engineer / AI Builder`) and the
   `showPhoto` / `showBooks` switches are design-tool props: build the default (first variant,
   photo and books on).
