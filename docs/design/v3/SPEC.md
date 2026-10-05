# v3: one CV page, "Senior Software Product Engineer"

Source: Claude Design project (https://claude.ai/design/p/c02bb441-acb3-4cdb-ab65-ef32c1327b65),
file "CV Senior Product Engineer v3". `design.dc.html` here is the exported file (open it next to
`support.js` in a browser; it loads React from unpkg). Exported by the orchestrator on 2026-10-05.
Renders: `screenshot.png` (1280 px wide, full page), `screenshot-mobile.png` (390 px).
Assets: `assets/` (photo, four books, app icons, company logos).

This package **replaces both pages**: `/` (today's CV in the Forest look) and `/new` (the Forest
profile) become one page with this design's structure, texts and look. It supersedes
`docs/design/forest/` as the **style reference** for the whole site (chat included); the Forest
package stays as history. The **texts** in `design.dc.html` (EN) are the content source of truth:
all of them, including the `buildJobs()`, `loop`, `impact` and `skills` data in its script.

**Update 2026-10-05 (handoff).** The human's later design session in the same file is exported
here: `design.dc.html`, the renders, the three changed assets (`cv_app_spoton.png`,
`cv_app_august.png`, `cv_logo_samsung_hq2.png`) and `design-print.dc.html` (A4 print layout, not
built yet). The designer's delta list with exact values is `HANDOFF-2026-10-05.md`: type scale,
job and project block layout, dot bullets, texts, contacts, footer CTA layout, footer, assets.
Items it lists that the site already has (e.g. LinkedIn, no "Shipped apps" section) need no work.
Where it disagrees with the sections below, the handoff and `design.dc.html` win.

## Tokens

Colours (names are proposals; the Theme task fixes them in `src/theme/tokens.css`):

| Value | Role |
|---|---|
| `#F2EEF8` | page background behind the card |
| `#FFFFFF` | the page card; pills inside the footer CTA |
| `#16131C` | primary text |
| `#2A2433` | reading text (summary, bullets) |
| `#5E5770` | secondary text, meta bar, roles, card prose |
| `#8C859A` | periods, © |
| `#8A3FE0` | links, mono labels, tags text |
| `#D9328F` | link hover; bullet "—" (at 60 % opacity) |
| `#C0267C` | label on the pink card |
| `#FF4FB8 → #8B5CF6` | the gradient: "Product" (text clip), primary CTA, AI stat, initials tile, ✦, ↗ (90° for text/CTA, 135° for tiles) |
| `#F7F4FB` | neutral surface: stat tiles, secondary buttons, cards, logo tiles |
| `#FDE6F3` | pink surface (craft card 2, impact card 2) |
| `#F4EAFE` | lilac surface (impact card 1, tags) |
| `#EFE5FC` | education card |
| `#ECE6F3` | 1 px dividers |
| `#C7B5EC` | dotted project tree lines (2 px) |
| `#FBE3F2 → #ECE3FD` (135°) | footer CTA background |
| `linear-gradient(150deg,#2A1F3D 0%,#16131C 45%,#0E0C12 100%)` | "How I build" dark panel; text `#F4F2F7`, borders `#3A3248`, step numbers `#FF7ACB`, footnote `rgba(255,255,255,.85)` |
| `#15803D` / `#16A34A` | "Open to roles" text / 7 px dot |
| shadows | card `0 30px 80px -40px rgba(139,92,246,.18)`; dark panel same at `.5`; CTA `0 10px 24px -10px rgba(255,79,184,.5)`; launcher `0 16px 40px -12px rgba(139,92,246,.45)` |

Fonts: **Figtree** 400/500/600/700 (everything) and **JetBrains Mono** 400/500 (meta bar, labels,
periods, tags, step numbers, footnote). Self-host them like the current fonts (latin + cyrillic;
Figtree has no cyrillic → see Decision 3).

Type, radii and spacing: take the literal values from `design.dc.html` (they are inline styles;
`clamp(...)` values stay fluid). Main ones: h1 `clamp(40px,7vw,84px)`/600/-.045em; h2
`clamp(26px,3vw,34px)`/600; body 16 px / 1.55–1.6; summary `clamp(17px,1.7vw,20px)`/1.6; mono 12.5
and 14 px. Radii: card `clamp(24px,3vw,36px)`, cards 20–28, pills 999, logo tiles 12, books 6.
Page: card max-width 1120, padding `0 clamp(14px,3vw,42px)`, section gap `clamp(48px,7vw,88px)`.

## Structure (top to bottom)

1. **Meta bar** (nav): `~/andrew.panasiuk/cv` left; right: location, "Remote / B2B across EU",
   "Open to roles" (green dot) on its own line.
2. **Header**: photo 72–96 px (radius 24) + name + "Android since 2012 · Agentic engineering";
   h1 "Senior Software **Product** Engineer" (variant A; variant B is not used); summary (5
   lines, `<br>`-separated); 2×2 stat tiles (12+, 1M+, 2, AI — the last on the gradient); contact
   buttons: Email me ↗ (gradient), WhatsApp, Telegram, LinkedIn.
3. **Code craft × agentic process**: two cards (before AI / with agents).
4. **How I build with agents** (+ mono "system with feedback"): dark panel, lead sentence, 6 loop
   steps 01–06, footnote "↺ every retro lands as a PR to the rules…".
5. **Selected impact**: 3 cards (1M+, 3 days, 1 day) on lilac / pink / neutral.
6. **Experience**: 9 jobs, each: logo tile 44 px (Samsung: plain logo, no tile), company + period,
   role, optional store meta (ivi); below, from the logo's left edge: tag (`product`, Samsung `tool`) +
   one-line about, then dot bullets (handoff §2, §4).
   Transcenda has **projects** (SpotOn, Cync, August Home) on a dotted tree: icon, name, domain
   pill, meta (stars "★"), about, bullets. The first job "AI-powered CV" uses the photo as logo.
7. **Skills**: 6 groups, 3 columns on desktop, 1 px top rules.
8. **Education** (lilac card) + **About me** (neutral card: 4 book covers, "Reading on systems",
   "Off-screen").
9. **Footer CTA**: two columns (handoff §6b): left "Let's build something ↗" (hover: gradient
   text); right the email pill with ↗ circle, then WhatsApp / LinkedIn pills (no Telegram).
10. © 2026 Andrew Panasiuk.
11. **"Ask my AI"** launcher: fixed pill bottom-right (✦ circle on the gradient + label). It opens
    our chat (in the design it is a plain link).

Mobile (390 px): see `screenshot-mobile.png`; everything wraps by the inline flex/grid rules, no
separate layout.

## Orchestrator decisions

1. **One page, one URL.** `/` shows this page. `/new` stays reachable and shows the same page
   (old links keep working); there is no second page any more. How (alias vs redirect) is the
   architecture's call.
2. **English only** (the human, 2026-10-05). No Ukrainian anywhere: no translation, no language
   switcher, no `uk` locale (ADR-0006 → Decision 6).
3. **Fonts:** Figtree + JetBrains Mono, latin subsets only.
4. **Logos** (handoff 2026-10-05 replaces the earlier picks). Samsung: `assets/cv_logo_samsung_hq2.png`
   (256×256, transparent), shown plain (no tile); it replaces `cv_logo_samsung.svg`. SpotOn:
   `assets/cv_app_spoton.png`, the 256×256 circle mark. August Home: the high-res
   `assets/cv_app_august.png`.
5. **Dropped from the design file:** headline variant B, the "TnAir" alternative palette and the
   unused `apps` list (Savant). They are not part of the page.
6. **Chat.** The "Ask my AI" pill replaces the round launcher; the chat panel keeps its behaviour
   (`docs/design/chat/SPEC.md`) and is restyled to this palette (the Forest-dark panel becomes the
   v3 dark panel colours above). The chat answers about this one page.
7. **Show case button** goes at the end of the meta bar (as today in Forest), styled as a small
   mono pill in this palette.
8. Contact links: phone numbers and URLs exactly as in the design (`wa.me/380938977110`,
   `t.me/+380938977110`, LinkedIn `in/andriipanasiuk`).

## Architecture notes

From CV-107 ([ADR-0006](../../adr/0006-one-page-v3.md); it wins where this list is short).

- **English only** (the human, 2026-10-05). This overrides Orchestrator decisions 2 and 3 and the
  language-switcher part of 7: no UK translation, no Cyrillic font, no switcher. Figtree and
  JetBrains Mono are latin only. The meta bar's end holds only the Show case button.
- **Data:** a new `CvPage` model (`src/data/cvPage.ts`, `src/data/mock/cvPage.json`) with the
  texts of this design. Section headings and fixed words ("Email me", the handle, ©) are the
  screen's strings. Card tones are set by position in the screen, not by data.
- **Screen:** `src/screens/home/`, with the components in the screen folder. Test ids use the
  `home-` prefix (the list is in ADR-0006 → Decision 2; the show's layers depend on it). Assets
  are copied to `src/screens/home/assets/home_*`.
- **URL:** `/`. `/new` is a 307 redirect to `/` in `vercel.json`.
- **Tokens:** role names without a look prefix (`--color-*`, `--gradient-*`, `--shadow-*`,
  `--font-sans`/`--font-mono`, `--type-<role>-*`, `--radius-*`, `--page-*`). The table is in
  ADR-0006 → Decision 5.
- **Chat:** `/api/chat` `v: 4` (`docs/chat/API.md` → v4). The page's sections are `header`,
  `craft`, `loop`, `impact`, `experience`, `skills`, `education`, `about`, `contacts`. There are
  three tools. The "Ask my AI" pill is the chat's launcher.
- **Show case:** one scenario, `retro-4` (`docs/retro/ARCHITECTURE.md` §11).
