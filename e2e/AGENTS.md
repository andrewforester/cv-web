# e2e

Why it exists: the last gate before a change reaches visitors. It proves that the production
build actually starts and works in a real browser, in an English browser, which unit tests in jsdom
can't: a green build can still crash at startup. It is the *web check* in the root `AGENTS.md`
and the `web-smoke` job in CI.

What it guarantees today:
- The one CV page (`/`, docs/design/v3) loads directly with no page or console errors, shows all
  nine jobs and no Show case button (the show is off), and fits a phone screen without horizontal
  scrolling (`home.png`, `home-mobile.png`); `/new` shows the same page (locally the same app;
  production redirects it); a `uk-UA` browser gets the English page.
- The chat answers a question with a streamed reply, and rate limiting shows its notice. A `#ask`
  link opens it; its look is screenshotted empty and answered, desktop and phone. Until the chat
  moves to v4 (CV-111) it still sends v2 with the old pages' ids (`/new` → `page: "profile"`).
- The page agent: opening a contact asks for confirmation and does nothing on Cancel. The one
  page's scroll and highlight cases come with CV-111.
- The show is a lazy chunk (`retroLazy.spec.ts`): `?retro=0` never requests it. The show's own
  specs (`retro.spec.ts`, with the helpers in `retroShow.ts` taking the page's `SHOW_URLS`) and
  the show-mode lazy-chunk cases come back with `retro-4` (CV-107 Build split → T6).

Place in the architecture: runs against `vite preview` of `dist/` (port 4173 in CI, a per-worktree port locally, `PW_PORT` overrides; never reuses a running server), where `/api/chat` doesn't
exist, so every chat scenario mocks the endpoint with scripted SSE, and the show runs scripted
(automation gets no LLM). No test here calls a real model. Specs about today's site open
`NORMAL_SITE` (`?retro=0`, `support.ts`; the default since the show stopped starting on its own).
Screenshots land in `web-check/` (git-ignored); CI uploads them as an artifact and sessions attach
them to the ticket.
