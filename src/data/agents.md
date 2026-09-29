# data

The CV data layer: what the site shows and where it comes from. UI never imports from here
directly except through a screen's state holder (`useCvRepository()` inside `use<Screen>State`).

- `models.ts`: `Cv`, the whole CV of `docs/design/cv/SPEC.md`, already localized: `header`
  (name, headline, tagline, photo, `contacts`), `summary` lines, `technologies` (`TechnologyCard`:
  title, items, variant `default|highlighted|ai`, desktop column 1–3), `latestExperience` and
  `previousExperience` (`ExperienceEntry`: company, remote, role, period, logo, bullets), `apps`
  (`AppCard`), `education` lines, `books`, `interests`.
  Rich text is `RichText` = `TextSpan[]` (`{ text, emphasis?: 'medium' | 'boldItalic' }`), no
  HTML. Images are `ImageRef`: a bundled asset id (resolved by the screen) or an absolute URL.
  Technology cards, experience entries, apps and books carry an `id`: a stable lowercase slug,
  equal in every locale, used by the AI page agent (`chat/agentTools.ts`, `data-agent-id`).
- `CvRepository.ts`: the seam. `getCv(locale): Promise<Cv>`, async so an HTTP backend fits.
- `CvRepositoryContext.ts`: React context + `useCvRepository()` hook.
- `mock/`: `StaticCvRepository` over `cv.en.json` (all SPEC content). Locales without a JSON
  (`uk` for now) fall back to English; add `cv.uk.json` to translate (keep the same `id`s:
  `mock/cvIds.test.ts` checks them).
- `chat/`: the AI chat's data layer and the `/api/chat` contract (own `agents.md`).

Binding: `src/app/AppProviders.tsx` creates the repository. A backend (planned, to edit the CV)
adds e.g. `http/HttpCvRepository.ts` and swaps that one line. Tests pass a fake repository into
`AppProviders`.
