# e2e

Why it exists: the last gate before a change reaches visitors. It proves that the production
build actually starts and works in a real browser, which unit tests in jsdom
can't: a green build can still crash at startup. It is the *web check* in the root `AGENTS.md`
and the `web-smoke` job in CI.

What it guarantees today:
- The one CV page (`/`, docs/design/v3) loads directly with no page or console errors, shows all
  nine jobs and the Show case button in its meta bar, and fits a phone screen without horizontal
  scrolling (`home.png`, `home-mobile.png`); `/new` shows the same page (locally the same app;
  production redirects it).
- The chat sends `v: 4` (no page id, no locale) and answers a question with a streamed reply;
  it offers the page's four first questions, and rate limiting shows its notice. A `#ask` link
  opens it; its look is screenshotted empty and answered, desktop and phone.
- The page agent on the one page (`agent.png`): scrolls to the selected impact, highlights the
  Transcenda job (and the next snapshot says so), and opens LinkedIn in a new tab only after the
  visitor confirms; Cancel opens nothing.
- The Show case (`retro.spec.ts`, `retro-4`, helpers in `retroShow.ts` on `SHOW_URLS`): at t = 0
  the broken page alone (`retro-start.png`), guard 4 after every chunk (`retro-mid.png`), guard 3
  (ends as `?retro=0`, `retro-end.png`), the motion-on timing smoke (60–130 s) and the Show case
  click. The show is a lazy chunk (`retroLazy.spec.ts`): `?retro=0` never requests it, `?retro=1`
  shows no frame of today's page first, and a failed chunk leaves the normal site.

Place in the architecture: runs against `vite preview` of `dist/` (port 4173 in CI, a per-worktree port locally, `PW_PORT` overrides; never reuses a running server), where `/api/chat` doesn't
exist, so every chat scenario mocks the endpoint with scripted SSE, and the show runs scripted
(automation gets no LLM). No test here calls a real model. Specs about today's site open
`NORMAL_SITE` (`?retro=0`, `support.ts`; the default since the show stopped starting on its own).
Screenshots land in `web-check/` (git-ignored); CI uploads them as an artifact and sessions attach
them to the ticket.
