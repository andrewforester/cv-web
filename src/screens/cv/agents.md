# cv

The CV page (the site's root page): Andrew Panasiuk's CV as one scrolling page, built from
`docs/design/cv/SPEC.md` (render reference `page1.png`). Part 1 (#7): sections 1–4; part 2 (#8)
adds Apps, Education, About me, Previous Experience at the marked point in `CvScreen.tsx`.

- `useCvState()` loads `Cv` via `useCvRepository().getCv(locale)` → `CvUiState`
  (`loading` | `error` | `ready {cv}`); `CvRoute` glues it to the stateless `CvScreen`.
- `CvScreen` composes sections in SPEC order: `HeaderSection` (name, headline, tagline, photo,
  `ContactList` with mailto/tel/WhatsApp/Telegram links), `SummarySection`, `TechnologiesSection`
  (3 flex columns by `card.column`; under 720 px CSS columns reflow them to 2, under 600 px to 1)
  with `TechnologyCardView` (variants `default`, `highlighted` = yellow border + star, `ai` =
  masked gradient border), `LatestExperienceSection`.
- Shared inside the screen (part 2 reuses them): `SectionTitle`, `ExperienceEntry` (+
  `ExperienceList`, 30 px stack), `RichTextLine` (renders `RichText` spans; emphasis `medium` /
  `boldItalic`).
- Images: data holds `ImageRef` ids; `images.ts` maps ids to bundled files in `assets/`
  (`cv_*`, resized to ≤ 2× display size from `docs/design/cv/assets/`) and passes URLs through.
  Part 2 adds its ids (app icons, logos, book covers) to `DATA_IMAGES`.
- Texts: UI labels in `strings.ts` (`cv` namespace, English only; `uk` falls back to `en`); all CV
  content comes from `src/data`.
- Test ids: `testIds.ts`. Tests: `CvRoute.test.tsx` (mock data: name, contacts, 9 cards, Transcenda;
  error state), `RichTextLine.test.tsx`.

Stubs: image sizes (`--cv-photo-size`, `--cv-logo-size`, `--cv-icon-size`) are screen-local
custom properties in `CvScreen.module.css`; emphasis weights reuse `--font-subsection-weight` /
`--font-name-weight`. Both `TODO(theme)`: move to theme tokens if the theme adds them.
