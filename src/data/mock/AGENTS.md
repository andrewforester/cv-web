# data/mock

Why it exists: the CV itself, as bundled JSON, until the CV-editing backend exists. It is the
single source of the CV's content: the page renders it and the AI chat answers from it
(`server/chat/knowledge/`), so they never disagree.

Place in the architecture: the current implementation of the `CvPageRepository` seam
(`StaticCvRepository`), bound in `src/app/AppProviders.tsx`; the backend will replace that
binding, not the screens.

Rules and limits:
- `cvPage.json` is the one page v3, English only: every text of `docs/design/v3/design.dc.html`
  verbatim, with the ids of ADR-0006 → Decision 1 (tests check them and that the contact ids equal
  the chat's `CV_CONTACT_CHANNELS`). Image refs are asset ids the home screen resolves.
- Item ids are addressed by the AI page agent, so they never change with the wording.
