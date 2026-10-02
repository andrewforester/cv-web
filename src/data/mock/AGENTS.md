# data/mock

Why it exists: the CV itself, as bundled JSON, until the CV-editing backend exists. It is the
single source of the CV's content: the page renders it and the AI chat answers from it
(`server/chat/knowledge/`), so they never disagree.

Place in the architecture: the current implementation of the `CvRepository` seam, bound in
`src/app/AppProviders.tsx`; the backend will replace that binding, not the screens.

Rules and limits:
- Only English exists today (`cv.en.json`); other locales fall back to it. To translate, add
  `cv.<locale>.json` with the same structure.
- `profile.<locale>.json` is the content of `/new` (`ProfileRepository`, same class), in EN and UK.
  EN is the Forest design's text verbatim; UK is a translation that keeps company/product names,
  numbers and tech terms. The chat doesn't know this content yet; it answers from `cv.*.json`.
- Item ids (technology cards, experience entries, apps, books, every profile list item) are
  addressed by the AI page agent, so they must be identical in every locale file and never
  translated; tests check it.
