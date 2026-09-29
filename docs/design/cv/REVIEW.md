# CV page: design review (GRA-18)

Review of the main CV page as built from `docs/design/cv/SPEC.md` and `src/theme/tokens.css`. It is a review only: nothing here is implemented. The human picks which recommendations become tasks.

**Method.** Production build (`npm run build`, `vite preview`), Chromium via Playwright, chat widget hidden. Viewports: desktop 1280×800 and 1440×900 (1×), mobile 390×844 and 360×800 (2×), plus a 320 px reflow check. Locales: EN and UA. **UA today renders English CV content** (only `cv.en.json` exists, `cvStrings` has no `uk` block; see F8), so Ukrainian wrapping was checked with a *simulated* translation injected into the DOM (files named `*-uksim-*`). Contrast ratios are WCAG 2.x relative-luminance ratios against `#FFFFFF`, alpha colours flattened on white. Screenshots are attached to GRA-18 in Linear, not to git; names below refer to them.

## Summary

**Verdict.** A clean, faithful transfer of the PDF CV: calm single column, one consistent navy, good body contrast (15.6:1), no layout breakage from 320 px to 1440 px, no console errors. But it still reads like an A4 page rather than a web CV. The type scale is flat (the name is only 3 px larger than a section title), list items have no markers, the order is set by A4 pagination (no employer or date appears in the first screen on any viewport), and the green-glow cards plus the rainbow border make the page look like a template instead of a senior engineer's CV. Two AA failures: the 9 px app publisher line (3.85:1) and the 18 px WhatsApp/Telegram targets.

**The 5 changes with the biggest effect** (all incremental, no restyle needed; see `mockup-desktop-1280-full`, `mockup-mobile-390-fold`):

1. **Real bullets** in Summary and Experience: a 5 px dot, an 18 px hanging indent, and 6 px between items (F1). This is the biggest scanability gain for the least work.
2. **A type scale with real steps:** name 24 → 36 px, sections 21/500 → 22/600, body 15/22 → 16/24, letter-spacing 0.02em → 0, and line-heights that are not equal to the font size (F2, F5, F6).
3. **Experience first:** Summary → Latest experience → Apps → Previous experience → Technologies → Education → About me (F7).
4. **One quiet card style:** a neutral border `#D5DAE8` and a navy-tinted hairline shadow instead of the mint border and green glow; app cards use the page palette (F9).
5. **Fix the two AA failures:** publisher 9 px → 12 px in `#047857`, and contact hit areas ≥ 44 px (24 px minimum) (F3, F4).

## Findings

Priorities: **Critical** = fails WCAG AA or breaks the 30-second scan; **Important** = visibly hurts readability, hierarchy or trust; **Polish** = refinement. Each finding: where → what → why → recommendation.

### Critical

**F1. List items have no markers.** Summary, Latest experience, Previous experience · all viewports, both locales, worst on mobile and UA.
- *What:* bullets are plain `<p>` lines with no marker and no gap between them. When one wraps, its second line looks like a new item ("both serving 1M+ users", "resilience" in `desktop-1280-en-latest`). On mobile nearly every item wraps (`mobile-390-en-summary`, `mobile-390-en-prev-rosfines`, `mobile-360-uksim-latest`), so the reader can't count achievements. The Figma PDF could rely on short lines; the web cannot.
- *Why:* recruiters scan the bullets under a role to judge scope; without item boundaries they read a wall of text. Also WCAG 1.3.1: it's a list but isn't marked up as one.
- *Recommendation:* render bullets as `<ul>/<li>`. Marker: a 5 × 5 px dot in `--color-text-secondary`, hanging indent 18 px (text starts at 18 px, dot at 3 px, vertically centred on the first line: `top: 10px` at 24 px line-height). Gap between items 6 px (the spec's existing `calc(var(--space-1) * 1.5)`). Use the same list style for the Summary lines. New tokens: `--list-indent: 18px`, `--list-gap: 6px`, `--list-marker-size: 5px`.

**F2. Flat type hierarchy.** Header, section titles, entries · all viewports.
- *What:* name 24/700, section 21/500, company 17/500, body 15/400. Adjacent steps are only 1.13–1.24× apart, section titles and company names share weight 500, and the name is 1.6× the body. At a glance the name, "Summary" and "Transcenda" weigh about the same (`desktop-1280-en-full`, `desktop-1440-en-fold`).
- *Why:* the scan path should be name → role → employers → dates. A flat scale forces reading instead of scanning, and the page lacks a clear anchor at the top.
- *Recommendation* (≈1.25–1.4 steps; see `mockup-desktop-1280-fold`):
  - `--font-name-size: 24px → 36px`, `--font-name-line-height: 24px → 40px`, letter-spacing `-0.02em`; under 600 px `30px / 36px`.
  - `--font-section-size: 21px → 22px`, `--font-section-line-height: 22px → 28px`, `--font-section-weight: 500 → 600`, letter-spacing `-0.01em`.
  - `--font-subsection-weight: 500 → 600` (companies, "Favourite books", "Interests"), size stays 17 px.
  - `--font-body-size: 15px → 16px`, `--font-body-line-height: 22px → 24px` (see F6).

**F3. App publisher line fails contrast and is 9 px.** Apps · all viewports.
- *What:* "Savant Systems, Inc." is 9 px / 500 in `rgba(3,135,95,0.9)` = `#1C936F` on white: **3.85:1**, below the 4.5:1 AA minimum (1.4.3), at the smallest size on the page (`desktop-1280-en-apps`).
- *Why:* AA failure. It's also illegible on phones, and it's the only green text on the page.
- *Recommendation:* `--font-app-publisher-size: 9px → 12px`, `--font-app-publisher-line-height: 9px → 16px`, `--color-app-accent: rgba(3,135,95,0.9) → #047857` (5.48:1). Simpler still: use `--color-text-secondary` (7.0:1) and drop the green (see F9).

**F4. Contact tap targets are too small.** Header contacts · mobile (also desktop pointer).
- *What:* the WhatsApp and Telegram links are the 18 × 18 px icons, 4 px apart (centres 22 px apart), so they fail WCAG 2.2 **2.5.8 Target Size (Minimum, AA)**: 24 px, or 24 px circles must not overlap. The email and phone links are 22 px tall. The Gmail icon is not part of the mailto link. The language switcher buttons are 45 × 32 px. See `mobile-390-en-header`.
- *Why:* contacting him is the one action this page exists for, and on a phone the messenger icons are the natural path.
- *Recommendation:* keep the visual size small but make hit areas ≥ 44 × 44 px (the 2.5.5 / Apple HIG size; 24 px is the AA floor): `--cv-icon-size: 18px → 20px`, and each icon link gets `padding: 12px; margin: -12px` (the visual spacing stays, the hit area grows). The contact row gets `min-height: 44px` under 600 px. Wrap the Gmail icon into the mailto link. Switcher: `min-height: 44px` under `(pointer: coarse)`. (`mockup-mobile-390-fold` shows the enlarged hit areas as spacing, for illustration only.)

### Important

**F5. Line-heights equal to the font size collide when text wraps.** Many tokens · mobile and UA especially.
- *What:* `--font-name` 24/24, `--font-subsection` 17/17, `--font-card-title` 15/16, `--font-meta` 14/14, `--font-book-title` 15/15, `--font-book-author` 13/13, app name 17/17, label 12/12, publisher 9/9, tag 11/12. They come from single-line PDF boxes. On the web they wrap: the name "Andrew / Panasiuk" on 390/360 has touching lines (`mobile-390-en-header`), the UA card title "Продуктове мислення" is squeezed (`desktop-1280-uksim-tech`), and "Останній релевантний досвід" wraps at 360 px on 22 px leading (`mobile-360-uksim-latest`).
- *Why:* touching lines read as one blob. Ukrainian is ~15–25 % longer, so more titles wrap.
- *Recommendation:* line-height ≥ 1.2× for headings and ≥ 1.35× for text: name `40px` (mobile `36px`), section `28px`, `--font-subsection-line-height: 17px → 24px`, `--font-card-title-line-height: 16px → 20px`, `--font-meta-line-height: 14px → 20px`, `--font-book-title-line-height: 15px → 20px`, `--font-book-author-line-height: 13px → 18px`, `--font-app-name-line-height: 17px → 24px`, `--font-app-value-line-height: 15px → 20px`, `--font-app-label-line-height: 12px → 16px`, `--font-tag-line-height: 12px → 16px`. Then the 600 px override in `AboutSection.module.css` (interests line-height) is no longer needed.

**F6. Global +0.02em letter-spacing.** All text.
- *What:* `--letter-spacing: 0.02em` on every element, body included. Inter's spacing is already tuned for text sizes; positive tracking loosens body copy, softens headings and makes lines ~2 % longer. That's why "Autonomous … team leadership." wraps onto a one-word line on desktop while the Figma render (`page1.png`) keeps it on one line (`desktop-1280-en-summary`).
- *Why:* denser, calmer texture; fewer orphans; headings gain weight without getting bigger.
- *Recommendation:* `--letter-spacing: 0.02em → 0`. Headings negative (name `-0.02em`, section `-0.01em`). Keep `+0.02em` only for ≤ 12 px labels (app labels, tag). Add `font-variant-numeric: tabular-nums` to dates and app stats so the right-aligned date column lines up.

**F7. Section order follows A4 pagination, not the reader.** Page structure · all viewports.
- *What:* the first screen shows name, summary and technologies but **no employer or date** on any viewport (`desktop-1280-en-fold`, `desktop-1440-en-fold`, `mobile-390-en-fold`). Latest experience starts at y ≈ 976 px on desktop and ≈ 1680 px on mobile (after ~900 px of technology cards). Previous experience comes after Education, the books and Interests (y ≈ 1877 desktop, ≈ 3180 mobile, almost 4 phone screens down). In the PDF this order came from fitting A4 pages (About me fills page 2); a scrolling page has no such constraint.
- *Why:* in a 30-second scan a recruiter looks for: current role, seniority, years, employers, and how long at each. Splitting experience around a book shelf breaks the timeline.
- *Recommendation:* Header → Summary → Latest experience → Apps → Previous experience → Technologies → Education → About me (`mockup-desktop-1280-full`). Optional: merge the two experience sections into one "Experience" with Transcenda first and the app cards directly under it. The spec is the source of the order, so change `SPEC.md` → Structure along with the code. (Keeping Technologies before Experience is a defensible alternative for keyword scanning, but only after F10 makes that block much shorter.)

**F8. The UA switch changes nothing visible on the CV, but it changes `lang`.** Whole page · UA.
- *What:* with UA on, all CV content and section titles stay English (`desktop-1280-uk-fold`); only the chat strings change. Meanwhile `<html lang="uk">` is set, so screen readers read English text with Ukrainian pronunciation (WCAG 3.1.1 Language of Page).
- *Why:* a visitor who taps UA sees nothing happen and concludes the switch is broken, which is a trust hit on a page whose whole job is trust.
- *Recommendation* (for the product owner; translation itself is out of scope here): until `uk` content exists, either hide the UA option, or keep it and set `lang="en"` on the CV `<article>` when the content fell back to English. The simulated UA text wraps acceptably once F5 is fixed; no other layout change is needed for Ukrainian (`desktop-1280-uksim-header`, `mobile-360-uksim-apps`, `mobile-390-uksim-full`).

**F9. Four unrelated colour systems.** Technologies, Apps, switcher · all viewports.
- *What:* navy text (`#001670`, `#445598`), mint card borders `#49CC8F` with a green glow (`0 4px 12px rgba(25,198,89,.25)`), amber highlight `#EFBF04`, a rainbow gradient border (AI Tools), and app cards on their own Google-Play palette (`#202124` text, `#717479` labels, green publisher and border). The green has no relation to the navy. The glow halos are the loudest thing on the page and date the style to ~2019 template kits (`desktop-1280-en-tech`, `desktop-1280-en-apps`).
- *Why:* "restrained and trustworthy" needs one ink and at most one accent. Nine glowing boxes pull the eye away from the experience.
- *Recommendation:*
  - `--color-card-border: #49CC8F → #D5DAE8` (navy-tinted neutral; decorative, so no 3:1 needed).
  - `--shadow-card: 0 4px 12px rgba(25,198,89,0.25) → 0 1px 2px rgba(0,22,112,0.06)` (or `none`).
  - App cards use the page palette: `--color-app-text → var(--color-text)`, `--color-app-muted → var(--color-text-secondary)`, `--color-app-border → var(--color-card-border)` (then retire the `--color-app-*` tokens).
  - Keep amber only for the star and border of the highlighted card, and keep the AI gradient as the page's single playful signature. With the green gone it no longer competes. Result: `mockup-desktop-1280-full`.

**F10. Technologies block is tall and fragmented.** Technologies · desktop 3 columns of 204 px, mobile 1 column.
- *What:* on desktop each card wraps its list every 2–3 words into a ragged masonry (`desktop-1440-en-fold`). On mobile the nine full-width cards take ≈ 900 px, more than a whole screen (`mobile-360-en-full`).
- *Why:* it's keyword content that should be scannable in two seconds, not a set of tiles.
- *Recommendation:* with F9's quiet card style the desktop grid is fine. Under 600 px drop the card chrome and render a compact definition list: title 15/20/600, items 14/20 on the next line, 16 px between groups, no border or shadow. That's about 40 % shorter. Card padding on desktop `12px 15px → 12px 16px` (4 px grid).

**F11. Vertical rhythm: sections don't separate from entries.** All sections · all viewports.
- *What:* the space above a section title (36 px) is almost the same as between experience entries (30 px), and the title sits 12 px above its content. The proximity cue that groups entries under a section is weak, especially in Previous experience.
- *Recommendation:* new token `--space-section: 56px` (44 px under 600 px) for the section title's top margin, `12px → 16px` below it, entries stay 30 px (or 32 px to stay on the 4 px grid). The first section keeps a smaller top margin after the header (≈ 40 px).

**F12. Header layout.** Header · desktop and mobile.
- *What:* desktop: photo and contacts stack in the right column, leaving an empty ≈ 330 × 120 px block under the tagline. The contacts are small, right-aligned and start with icons, so the text edge is ragged. Mobile: the 120 px photo takes 31–33 % of the width, so the name breaks into two lines and the headline into 2–3 (`mobile-390-en-fold`, `mobile-320-en-fold`). The language switcher sits alone in its own row 36 px above the name.
- *Recommendation:* desktop: put the contacts in the left column under the tagline as one row of icon + text items (16 px gap), and centre the photo vertically against the intro. Under 600 px: `--cv-photo-size: 120px → 88px`, and the header row `margin-bottom: 36px → 16px`. Put the headline and tagline in one block: tagline `margin-top: 20px → 4px`, colour `--color-text-secondary`, not italic (italic 15 px Inter is the least legible style on the page).

### Polish

**F13. "remotely" tag.** Previous experience (RosFines, Smartling, ivi).
- *What:* 11 px italic superscript at 60 % alpha (`#6673A9`, 4.57:1, just passes). It reads like a footnote, and it sits inside the `<h3>`, so the heading's accessible name becomes "RosFinesremotely" (`mobile-390-en-prev-rosfines`).
- *Recommendation:* move it to the role line, "Android Lead · Remote", in `--color-text-secondary`, or make it a pill: 12/16, padding `2px 8px`, radius 999 px, background `rgba(0,22,112,0.06)`, colour `--color-text-secondary`, baseline-aligned. `--font-tag-size: 11px → 12px`.

**F14. Education breaks the entry pattern.** Education.
- *What:* two lines in 17/21 regular, larger than the body and than job titles, with the years inline.
- *Recommendation:* reuse the experience-entry layout: the institution as the company line, the degree as the role line (secondary), `2007 – 2012` as meta on the right. At minimum `--font-education-size: 17px → 16px`, line-height `24px`.

**F15. Apps row geometry.** Apps · desktop and mobile.
- *What:* desktop cards are 249 / 248 / 145 px wide (content-sized flex), and the Savant card overflows the column by 2 px (right edge 978 vs 976 at 1280). Mobile: three stacked cards take ≈ 350 px for three facts and the right half of each is empty (`mobile-360-uksim-apps`).
- *Recommendation:* desktop `grid-template-columns: repeat(3, minmax(0, 1fr))` (the publisher may wrap). Mobile: compact card, padding 12 px, with the icon on the left spanning the name and stats rows.

**F16. Dates.** Experience.
- *Recommendation:* en dash with thin spaces ("Feb 2021 – Feb 2026") and tabular figures (F6). Keep 14 px secondary. On the mobile stacked layout, the date on the role line ("Android Lead · 2017") would save one line per entry.

**F17. Books.** About me.
- *What:* title and author differ only by 2 px. On mobile the 2 × 2 grid works (`mobile-390-en-books`).
- *Recommendation:* title weight `400 → 500`, author colour `--color-text-secondary`. Line-heights per F5.

**F18. Accessibility details.**
- Company logos have `alt` = company name next to the same name in `<h3>`, so screen readers say it twice: use `alt=""`.
- Focus: links and buttons rely on the browser's default outline. Add a consistent `:focus-visible { outline: 2px solid var(--color-text); outline-offset: 2px; border-radius: 4px }`.
- Language switcher inactive border `#49CC8F` is 2.04:1. The text label identifies the button, but the outline is faint: use `--color-text-secondary` (7.0:1) or the new neutral border plus text.
- Reflow at 320 px: passes (no horizontal scroll). Heading order h1 → h2 → h3: correct.

**F19. Page end.** ≈ 104 px of blank space after the last entry (clearance for the chat button) and no footer. Optional: a small footer repeating email / phone plus "Updated <month year>". This also covers the FAB clearance.

## Readability and contrast

| Element | Colour | Size | Ratio | AA |
|---|---|---|---|---|
| Body, headings (`--color-text`) | `#001670` | 15–24 px | 15.57:1 | pass |
| Role, dates (`--color-text-secondary`) | `#445598` | 14–15 px | 7.00:1 | pass |
| "remotely" (`--color-text-muted`) | `rgba(0,22,112,.6)` → `#6673A9` | 11 px | 4.57:1 | pass (barely) |
| App name, values (`--color-app-text`) | `#202124` | 15–17 px | 16.10:1 | pass |
| App labels (`--color-app-muted`) | `#717479` | 12 px | 4.69:1 | pass (barely) |
| App publisher (`--color-app-accent`) | `rgba(3,135,95,.9)` → `#1C936F` | 9 px | **3.85:1** | **fail** |
| Card border (decorative) | `#49CC8F` | – | 2.04:1 | n/a |
| Highlight border (decorative) | `#EFBF04` | – | 1.73:1 | n/a (the only cue for "highlighted" besides the star) |
| Switcher inactive border (UI) | `#49CC8F` | – | 2.04:1 | label carries it; weak |

Line length: the 672 px column at 15 px gives ≈ 85–90 characters per line (the 91-character summary line wraps), at the upper limit. With F2 + F6 (16 px, tracking 0) it's ≈ 80, fine; mobile ≈ 40–45. Density: fine on desktop; on mobile the long Technologies block (F10) and the unmarked bullets (F1) make it feel dense.

## Responsive behaviour

- Reflow is solid: no horizontal overflow at 360 / 390 / 320 px, dates move under the role, tech cards go 3 → 2 → 1 column, books 4 → 2×2, apps stack.
- Weak spots: name wrap next to the big photo (F12), ≈ 900 px technology stack (F10), sparse stacked app cards (F15), small tap targets (F4), and experience starting ≈ 2 screens down (F7).
- 1440 vs 1280: identical column, only wider margins; fine for a reading page. The page never uses the width, which is acceptable for a CV (see Direction for a wide layout).

## Spec drift (implementation vs SPEC.md)

The implementation follows the spec closely; most issues above are in the spec's own decisions (PDF values × 1.5). Drift found:
- The Summary line "Autonomous … team leadership." wraps on desktop web, but is one line in the Figma render (tracking/rendering difference; fixed by F6).
- The Apps row overflows the 672 px column by 2 px at 1280 (F15).
- Language switcher: not in the spec; added as its own row with the card-border green outline (F12, F18).
- Interests line-height 20 px under 600 px: an intentional, good deviation (no longer needed after F5).
- The spec says "English only for now", while the app now offers UA (F8). Update the spec's Decisions when UA content lands.

## Modernity

Against strong 2025–2026 personal and CV sites (content-first single column or sidebar + column, large confident name, neutral ink with one accent, 1 px hairline surfaces, generous section spacing of 56–96 px, real lists and a clear timeline): the current page is a careful PDF port. The navy-only text and the Inter family are a sound, modern base. What dates it is the coloured glow shadows, the multi-palette cards, the small flat type and the PDF-driven order. With the incremental fixes (F1–F11) it reaches "clean, credible, current" without changing its character.

## Token changes at a glance (incremental)

| Token | Now | Proposed |
|---|---|---|
| `--letter-spacing` | `0.02em` | `0` (headings negative, ≤ 12 px labels keep `0.02em`) |
| `--font-body-size` / `-line-height` | `15px / 22px` | `16px / 24px` |
| `--font-name-size` / `-line-height` | `24px / 24px` | `36px / 40px` (< 600 px: `30px / 36px`) |
| `--font-section-size` / `-line-height` / `-weight` | `21px / 22px / 500` | `22px / 28px / 600` |
| `--font-subsection-line-height` / `-weight` | `17px / 500` | `24px / 600` |
| `--font-card-title-line-height` | `16px` | `20px` |
| `--font-meta-line-height` | `14px` | `20px` |
| `--font-education-size` / `-line-height` | `17px / 21px` | `16px / 24px` |
| `--font-tag-size` / `-line-height` | `11px / 12px` | `12px / 16px` |
| `--font-book-title-line-height` / `--font-book-author-line-height` | `15px / 13px` | `20px / 18px` |
| `--font-app-publisher-size` / `-line-height` | `9px / 9px` | `12px / 16px` |
| `--font-app-name-line-height` / value / label | `17 / 15 / 12px` | `24 / 20 / 16px` |
| `--color-app-accent` | `rgba(3,135,95,0.9)` | `#047857` (or `--color-text-secondary`) |
| `--color-card-border` | `#49CC8F` | `#D5DAE8` |
| `--shadow-card` | `0 4px 12px rgba(25,198,89,0.25)` | `0 1px 2px rgba(0,22,112,0.06)` |
| `--color-app-text` / `-muted` / `-border` | `#202124` / `#717479` / green | `var(--color-text)` / `var(--color-text-secondary)` / `var(--color-card-border)` |
| `--cv-icon-size` | `18px` | `20px` (+ 44 px hit area) |
| `--cv-photo-size` (< 600 px) | `120px` | `88px` |
| new `--space-section` | – | `56px` (< 600 px `44px`) |
| new `--list-indent` / `--list-gap` / `--list-marker-size` | – | `18px` / `6px` / `5px` |

## Direction (optional, bolder restyle; separate from the fixes above)

A **"sidebar CV"** for ≥ 1024 px that uses the width a desktop recruiter already has:
- Max width 1080 px, two columns: a sticky 300 px aside (photo 96 px, name 32/36, role, location, contacts as 44 px rows, LinkedIn / GitHub, "Download PDF", language switch, then Technologies as compact grouped tag lists) and a 640 px main column (Summary, Experience as a timeline with a thin year rail and the apps as small chips under Transcenda, Education, About me). The whole scan (who, how senior, where, contact) then fits in the first screen.
- Palette: keep `#001670` as the **accent** (name, links, markers, year rail), move body text to a calmer ink `#1D2B5E` (13.47:1), secondary `#4A5578` (7.34:1), hairlines `#E3E7F1`, one surface tint `#F7F8FC` for grouped blocks. Amber and the AI gradient only as tiny signature details.
- Type: Inter only, variable with optical sizing for display sizes; scale 13 / 14 / 16 / 18 / 22 / 28 / 40.
- Mobile: single column as in the fixes, plus a compact sticky bar (name + "Contact") after scrolling past the header.
- Optional: `prefers-color-scheme: dark` from the same token set.

This departs from the Power-Place layout (allowed by the brief). It's worth doing only if the page is meant to be the primary CV rather than a web copy of the PDF, and it needs its own design package (`SPEC.md` update) before implementation.

## Screenshots (in GRA-18)

As is: `desktop-1280-en-full`, `desktop-1440-en-fold`, `mobile-390-en-fold`, `mobile-360-en-full`, `mobile-320-en-fold`, `desktop-1280-uk-fold`. Close-ups: `desktop-1280-en-summary`, `desktop-1280-en-latest`, `desktop-1280-en-tech`, `desktop-1280-en-apps`, `mobile-390-en-header`, `mobile-390-en-summary`, `mobile-390-en-prev-rosfines`, `mobile-390-en-books`. UA simulation: `desktop-1280-uksim-header`, `desktop-1280-uksim-tech`, `mobile-360-uksim-latest`, `mobile-360-uksim-apps`, `mobile-390-uksim-full`. Mockups of the incremental fixes (CSS injected over the build): `mockup-desktop-1280-fold`, `mockup-desktop-1280-full`, `mockup-mobile-390-fold`.
