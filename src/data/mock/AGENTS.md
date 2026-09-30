# data/mock

Why it exists: the CV itself, as bundled JSON, until the CV-editing backend exists. It is the
single source of the CV's content: the page renders it and the AI chat answers from it
(`server/chat/knowledge/`), so they never disagree.

Place in the architecture: the current implementation of the `CvRepository` seam, bound in
`src/app/AppProviders.tsx`; the backend will replace that binding, not the screens.

Rules and limits:
- Only English exists today (`cv.en.json`); other locales fall back to it. To translate, add
  `cv.<locale>.json` with the same structure.
- Item ids (technology cards, experience entries, apps, books) are addressed by the AI page agent,
  so they must be identical in every locale file and never translated; a test checks it.
