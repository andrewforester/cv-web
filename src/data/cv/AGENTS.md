# data/cv

Why it exists: the CV itself, as bundled JSON. It is the canonical data (ADR-0007), not a mock:
the page renders it and the AI chat answers from it (`server/chat/knowledge/`), so they never
disagree. A CV edit is a commit to this file plus a deploy; the future editing backend writes the
file, it does not swap a binding.

Place in the architecture: `StaticCvRepository` serves it to the page through the
`CvPageRepository` seam, bound in `src/app/AppProviders.tsx`. The server reads it only in
`server/chat/cvPageData.ts`. Lint allows exactly those two readers (plus tests).

Rules and limits:
- `cvPage.json` is the one page v3, English only: every text of `docs/design/v3/design.dc.html`
  verbatim, with the ids of ADR-0006 → Decision 1 (tests check them and that the contact ids equal
  the chat's `CV_CONTACT_CHANNELS`). Image refs are asset ids the home screen resolves.
- Item ids are addressed by the AI page agent, so they never change with the wording.
