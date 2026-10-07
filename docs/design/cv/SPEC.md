# CV page (web) — design package

Source: Figma file `Power-Place` (key `ehr6aIVaitNHH1KafRlVQW`), frames **Page 4** `2550:474`, **Page 5** `2550:572`, **Page 6** `2550:659`. They are three A4 pages (595 × 842 pt) of the PDF CV. **On the web it is one continuous scrolling page** in the order Page 4 → 5 → 6, no page breaks.

Files: `page1.png`, `page2.png`, `page3.png` (Figma renders, 1×; `screenshot.png` = page 1), `assets/` (downloaded images and icons), `assets/raw/` (Figma mask shapes, reference only: implement masks with CSS `border-radius`).

Red/pink numbers and outlines in the renders (`2`, `8`, `20`, `80`, thin boxes) are **redline annotations** (measurements), not content. Don't render them.

## Scale

The design is in PDF points (body text 10 pt). On the web **every size = Figma × 1.5**, rounded to a whole px (body 15 px). All sizes below are already web px. The content column is `672px` wide max (448 pt × 1.5), centred, with a 24 px side gutter under 720 px viewport width.

## Tokens (Theme owns these names)

Colours:
| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#FFFFFF` | page, cards |
| `--color-text` | `#001670` | all main text (Figma also has `#011570`/`#021771`: same role, merged) |
| `--color-text-secondary` | `#445598` | job titles, dates |
| `--color-text-muted` | `rgba(0, 22, 112, 0.6)` | "remotely" tag |
| `--color-card-border` | `#49CC8F` | technology cards |
| `--color-highlight` | `#EFBF04` | highlighted card border + star |
| `--gradient-ai` | `linear-gradient(to bottom, #FF0000 0%, #FFFF00 23.6%, #0E1DF6 48.6%, #E413F3 76.4%, #EE0A0E 100%)` at 53 % opacity, rotated ≈ 38°, used as a **border** (see AI Tools card) |
| `--color-app-text` | `#202124` | app card name, rating, downloads |
| `--color-app-muted` | `#717479` | app card labels ("Downloads", "reviews") |
| `--color-app-accent` | `rgba(3, 135, 95, 0.9)` | app publisher line |
| `--color-app-border` | `rgba(3, 135, 95, 0.8)` | app card border |
| `--shadow-card` | `0 4px 12px rgba(25, 198, 89, 0.25)` | app cards and technology cards |
| `--shadow-book` | `0 3px 6px rgba(0, 0, 0, 0.25)` | book covers |

Type: **Inter** (Regular 400, Italic, Medium 500, SemiBold 600, Bold 700, Bold Italic), self-hosted. Letter-spacing `0.02em` everywhere unless noted.
| Token | Size / line-height / weight | Use |
|---|---|---|
| `--font-name` | 24 / 24 / 700 | name |
| `--font-section` | 21 / 22 / 500 | section titles |
| `--font-subsection` | 16.5 → 17 / 17 / 500 | company name, "Favourite books", "Interests" |
| `--font-body` | 15 / 22 / 400 | summary, experience bullets, headline, contacts |
| `--font-education` | 16.5 → 17 / 21 / 400 | education lines |
| `--font-card-title` | 15 / 16 / 600 | technology card title |
| `--font-card-body` | 14 / 20 / 400 | technology card text |
| `--font-meta` | 13.5 → 14 / 14 / 400 | dates (secondary colour), interests text |
| `--font-tag` | 11 / 12 / 400 italic | "remotely" (muted) |
| `--font-book-title` | 15 / 15 / 400 | book title |
| `--font-book-author` | 13 / 13 / 400 | book author |
| app card | name 16.5→17/500, publisher 9/500, value 15/500, label 12/400; letter-spacing `0.0078em` | |

Spacing / radii: `--radius-card: 12px` (Figma 8), `--radius-logo: 9px` (Figma 6, logos 36 px), `--border-card: 1px`. Spacing grid 4 px; common values 8, 12, 16, 24, 30, 36.

## Structure (top → bottom)

1. **Header** (two columns).
   - Left: name `Andrew Panasiuk` (`--font-name`); headline `Senior Android Engineer with iOS experience` (body); 20 px gap; tagline `Creating Android apps since 2012` (body, italic).
   - Right, right-aligned: photo `assets/photo.jpg`, 120 × 120 circle (`object-fit: cover`, crop centred on the face as in the render). Below it two contact rows, 8 px apart, icons 18 px:
     - `assets/icon_gmail.png` + `andriipanasiuk@gmail.com` → `mailto:` link.
     - `assets/icon_whatsapp.png` + `assets/icon_telegram.png` + `+48 519 457 129` → phone `tel:+48519457129`; WhatsApp icon → `https://wa.me/48519457129`; Telegram icon: no link (Telegram removed, CV-124; the old number was replaced everywhere, 2026-10-07).
   - Under 600 px: photo on top-right stays, contacts wrap under the left column.
2. **Summary** — section title, then paragraph lines (each on its own line on desktop):
   - Product-minded **Senior Android Engineer** (Medium 500) with 12+ years of experience.
   - Proficient in Kotlin, Coroutines, Jetpack, MVVM/MVI.
   - Integrating modern AI-driven tools and approaches into workflow.
   - Autonomous end-to-end feature delivery combined with trust and respect for team leadership.
   - Strong background in Applied Mathematics (M.Sc.).
   - Skilled yet maintaining a passion for crafting good software.
3. **Technologies** — section title, then a **3-column masonry** of cards (column gap 30 px, row gap 18 px). Order by column:
   - Col 1: **Android** — Jetpack Compose, Hilt, Room/SQLite, Picasso/Glide, Custom UI, Custom Animations · **Product mindset** (highlighted) — Feature ownership, Pixel-perfect UI, Human-centric UX, Product analytics basics · **Unit/UI testing** — JUnit, Mockk, Robolectric, JaCoCo
   - Col 2: **Kotlin** — Coroutines, Ktor, Flow, Kotlinx-serialization, Kotlin Multiplatform · **Architecture** — MVVM, MVI, Redux, Clean, SOLID · **Integrations** — Firebase Cloud Messaging, Locations API, SocketIO, REST/RPC API
   - Col 3: **AI Tools** (gradient border) — Copilot, agents.md, Cursor IDE, hallucination prevention, MCP, orchestration approach · **Tools** — Gradle, Git, Github Actions, CircleCI, CocoaPods · **iOS** — Swift, UIKit, AutoLayout, Stevia
   - Card: white, 1 px `--color-card-border`, `--radius-card`, `--shadow-card`, padding 12 px 15 px, title then body with 6 px gap. Width = column.
   - Variants: `highlighted` → border `--color-highlight` + `assets/icon_star_card.svg` (18 px) overlapping the top-right corner (centre on the corner); `ai` → 1.5 px gradient border (`--gradient-ai`, e.g. `border-image` or a masked pseudo-element keeping the radius).
   - 600–720 px: 2 columns; under 600 px: 1 column (keep the order above col by col).
4. **Latest relevant experience** — section title, one experience entry (see *Experience entry*): Transcenda · Senior Android Developer · Feb 2021 - Feb 2026 · logo `assets/logo_transcenda.png`. Bullets:
   - Took ownership on key features delivery for ***Cync*** and ***August Home*** smart home apps, both serving 1M+ users (Cync and August Home in Bold Italic)
   - Boosted engineering efficiency by integrating AI-driven workflows (Copilot, LLMs)
   - Developed complex custom graphics using Jetpack Compose Canvas
   - Supported BLE communication for realtime devices discovery, status sync and offline resilience
5. **Apps** — section title, a row of 3 app cards (gap 16 px; wrap to one per row under 600 px):
   - **Cync** · Savant Systems, Inc. · rating `5.0★` + `91.8K reviews` | `1M+` + `Downloads` · icon `assets/app_cync.png`
   - **August Home** · August Home, Inc. · `4.1★` + `18.7K reviews` | `1M+` + `Downloads` · icon `assets/app_august.png`
   - **Savant** · Savant Systems, Inc. · (no rating) `100k+` + `Downloads` · icon `assets/app_savant.png`
   - Card: white, 0.75 px `--color-app-border`, radius 12, `--shadow-card`, padding 15 px. Line 1 name, line 2 publisher (accent). Row below: icon 36 px (radius 9) → stat blocks, each a value (centred, star `assets/icon_star_rating.svg` 15 px after the rating) over a label; stat blocks separated by a 27 px vertical 0.75 px line `#C4C4C4`-ish (Figma divider; use `--color-app-muted` at 40 %).
6. **Education** — section title; two lines (`--font-education`): `Applied Mathematics, Cybernetics` / `Kyiv National University 2007 - 2012`.
7. **About me** — section title, then:
   - Subsection **Favourite books**: a row of 4 covers (gap ≈ 37 px, wrap under 600 px to 2 per row), each cover 100 × 150 px, `--shadow-book`, no radius; under it title (`--font-book-title`) and author (`--font-book-author`), 3 px apart:
     Antifragile / Nassim Nicholas Taleb (`book_antifragile.jpg`) · Siddhartha / Hermann Hesse (`book_siddhartha.jpg`) · The Goal / Eliyahu Goldratt (`book_the_goal.jpg`) · A Pattern Language / Christopher Alexander (`book_pattern_language.png`).
   - Subsection **Interests**: `Sports, forest hiking, e-bike riding, good books, volunteering, playing guitar, AI experiments` (`--font-meta`, text colour).
8. **Previous Experience** — section title, entries in this order:
   - **WiseHouse** · Android Developer · Mar 2020 - Feb 2021 · `logo_wisehouse.png` — Created MyIGB app from scratch to Google Play publication / Build an architecture based on MVI+Redux supporting offline mode / Setup CI with automatic builds sent to Telegram and Google Play / Wrote code 100% on Kotlin using modern libs: Coroutines, Flow, Ktor
   - **Attendify** · Android/iOS Developer · Jan 2018 - Mar 2020 · `logo_attendify.png` — Created number of features in 2 key projects both on Android and iOS / Setup CI with daily builds sent to Slack channel; migrated codebase to Kotlin / Deeply collaborate with designers to implement user-friendly UI
   - **RosFines** *(remotely)* · Android Lead · May 2017 - Aug 2017 · `logo_rosfines.jpg` — Built a development process in collaboration with PM; conducted hiring interviews / Setup CI with automatic deployment to Fabric Beta
   - **Smartling** *(remotely)* · Android SDK Developer · Feb 2016 - Aug 2017 · `logo_smartling.png` — Implement features for the mobile localization SDK / Increased code coverage with unit tests to 60+% / Setup Github as Maven repo for the SDK artifacts, wrote usage docs for the SDK
   - **Rokkit** · Android Developer · Jun 2015 - Jan 2016 · `logo_rokkit.jpg` — Created an unusual UX to search for the flight tickets and hotels all over the world
   - **ivi** *(remotely)* · Android Teamlead · Apr 2013 - Dec 2014 · `logo_ivi.png` — Ensured regular bug-free releases of the product with 1M+ users / Mentor a team of 2 developers, made a code review, collaborated with PM / Develop and support shared codebase for 3 ivi projects
   - **Samsung** · Android Developer · Jan 2012 - Sep 2012 · `logo_samsung.png` — Created an analogue of Android Layout Inflater for the custom UI framework

### Experience entry (shared by 4 and 8)
- Row: logo 36 px (radius 9, `object-fit: contain` on white for non-square logos like Rokkit/Samsung) → 12 px → column: company (`--font-subsection`) with an optional `remotely` tag (`--font-tag`) raised like a superscript 6 px after it; job title below (body size, secondary colour, 15/15). Dates right-aligned on the company line (`--font-meta`, secondary colour).
- Under the row, 9 px gap, bullets as plain lines (no markers), body style, full column width. Entries are 30 px apart.
- Under 600 px: dates go under the job title, left-aligned.

### Section title
`--font-section`, text colour, 36 px above (first one 30 px after the header), 12 px below.

## Behaviour

- Static page, no interaction beyond links (mail, phone, WhatsApp, Telegram). Links keep text colour; underline on hover/focus only.
- Images: `loading="lazy"` below the fold, meaningful `alt` for photo, logos (company name), app icons, book covers (title); decorative icons (star) `alt=""`.
- Print is out of scope.

## Assets

`photo.jpg` · contact icons `icon_gmail.png`, `icon_whatsapp.png`, `icon_telegram.png` · `icon_star_card.svg` (highlight star, has its own drop shadow) · `icon_star_rating.svg` · company logos `logo_*.png|jpg` · app icons `app_*.png` · book covers `book_*`. `card_border_*.svg` are Figma exports of card outlines for reference (colours, stroke) — implement cards in CSS.
Several PNGs are much larger than displayed (Telegram 3072 px, Gmail 1536 px, Siddhartha 1 MB): the implementation should ship resized copies (≤ 2× display size) in its own asset folder; keep these originals here.

## Decisions

- Web = one scrolling page in the PDF page order; the PDF page 2 and 3 top margins are dropped.
- Size scale ×1.5 from Figma points; content max width 672 px.
- `#011570`, `#021771`, `#455598` merged into `--color-text` / `--color-text-secondary`.
- Redline annotations are not rendered.
- Texts are copied verbatim from Figma, except author names corrected by the human: "Nassim Nicholas Taleb", "Hermann Hesse" (Figma has "Nicolas", "Herman").
- Contacts are links (mailto, tel, wa.me, t.me).
- English only for now; texts live in the data layer / strings, never hardcoded in components.
