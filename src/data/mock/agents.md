# data/mock

The CV as bundled JSON, served by `StaticCvRepository` (the `CvRepository` binding until a
backend replaces it in `src/app/AppProviders.tsx`).

- `cv.en.json`: all CV content of `docs/design/cv/SPEC.md`, typed as `Cv` (`../models.ts`). Also
  read by the chat backend (`server/chat/knowledge`) as the knowledge source.
- `StaticCvRepository.ts`: `getCv(locale)`; a locale without its JSON (`uk` for now) gets English.
- Item ids: technology cards, experience entries, apps and books have an `id` (lowercase slug,
  e.g. `kotlin`, `august-home`). The AI page agent targets them (`data-agent-id`), so they must be
  identical in every locale file and never be translated; `cvIds.test.ts` checks format,
  uniqueness and cross-locale equality. Adding `cv.uk.json`: copy the ids unchanged.
