# e2e

Why it exists: the last gate before a change reaches visitors. It proves that the production
build actually starts and works in a real browser, which unit tests in jsdom
can't: a green build can still crash at startup. It is the *web check* in the root `AGENTS.md`
and the `e2e` job of `.github/workflows/checks.yml`, run by Dev (Ready PRs; skipped when a PR
changes only docs), Staging (`feature/**` pushes) and Production (`main`).

Two Playwright projects, both inside `npm run web-check`: `desktop` (Chromium 1280 × 800) runs
every test; `mobile` (the same Chromium as a phone: 390 × 844, `isMobile`, `hasTouch`) runs only
tests whose title has `@mobile`. A test tagged `@mobile` runs once per project; it reads the
`isMobile` fixture where the phone differs and names screenshots with `screenshotPath()`
(`support.ts`: `<name>.png` on desktop, `<name>-mobile.png` on the phone). Specs that already loop
over their own viewports (`chat.spec.ts`, `voice.spec.ts`) stay untagged, so nothing runs twice.
A phone failure caused by a product bug gets `test.fail(isMobile, '<bug ticket>')`, not a fix here.

What it guarantees today:
- The one CV page (`/`, docs/design/v3) loads directly with no page or console errors and shows
  all nine jobs (the Show case button stays hidden, CV-144), on desktop and on the phone, where it
  also fits without horizontal scrolling (`home.png`, `home-mobile.png`); `/new` shows the same
  page (locally the same app; production redirects it).
- The chat sends `v: 4` (no page id, no locale) and answers a question with a streamed reply;
  it offers the page's four first questions, and rate limiting shows its notice. A `#ask` link
  opens it; its look is screenshotted empty and answered at three viewports: `wide` 1600 × 900
  (the slide: the page moves left beside the panel), `desktop` 1280 × 800 (the overlay: the same
  panel over the unmoved page) and `phone`.
- The page agent on the one page (`agent.png`, `agent-mobile.png`): scrolls to the selected
  impact, highlights the Transcenda job (and the next snapshot says so), and opens LinkedIn in a
  new tab only after the visitor confirms; Cancel opens nothing. On the phone the chat is the
  bottom sheet (snapshot `viewport: 'mobile'`, `chat: 'sheet'`); it stays open through a visual
  action and the target lands above it. The chat adds no history entry on any width.
- The Show case (`retro.spec.ts`, `retro-4`, helpers in `retroShow.ts` on `SHOW_URLS`): at t = 0
  the broken page alone (`retro-start.png`; also on the phone, `retro-start-mobile.png`; the
  rest of the show is desktop only), guard 4 after every chunk (`retro-mid.png`), guard 3
  (ends as `?retro=0`, `retro-end.png`), the motion-on timing smoke (60–130 s) and the Show case
  click. The show is a lazy chunk (`retroLazy.spec.ts`): `?retro=0` never requests it, `?retro=1`
  shows no frame of today's page first, and a failed chunk leaves the normal site.
- Every selector of every damage layer (`src/screens/retro/layers/*.css`, read from disk) matches an
  element on the show's first frame (`retroLayers.spec.ts`), so editing the CV can't leave a layer
  styling nothing.
- The voice call (`voice.spec.ts`): the scripted `FakeVoiceClient` (`?voice=fake`, which only the `build:e2e` build honours) with a mocked
  `/api/voice-session`; the "Talk to my AI" pill opens the chat, its Call button starts the call
  in the floating panel (on a phone the same bottom sheet as the text chat, its box unchanged
  across Call, Show chat / Hide chat and the end of the call), and its states (typing, the chat toggle, the
  pill, the transcript, reduced motion) are screenshotted against `docs/design/voice/` at the
  same `wide` (slide: the CV card 208 px left at its own width, the panel 400 × 600 beside it),
  `desktop` (overlay: the card unmoved) and `mobile` viewports; no test talks to ElevenLabs.

Production smoke: tests titled `@prod` (the home page on both projects, `/new` on desktop; `/new`
must end on `/`) also run against the live site right after CI deploys production
(`.github/workflows/prod-smoke.yml`, called by the `deploy` → `smoke` jobs in `production.yml`, plus a daily `schedule` and a manual `workflow_dispatch`, neither of which rolls back), with `curl`s that
`GET /api/chat` and `GET /api/voice-session` answer `405` JSON. A failed smoke rolls production back to the previous
deployment and leaves the Production run red. Locally: `npm run web-check:prod` (`PW_BASE_URL` overrides
the production domain; any `PW_BASE_URL` makes Playwright start no server). Never tag a test
`@prod` unless it makes no `/api/chat` call or mocks it.

Place in the architecture: runs against `vite preview` of `dist/` (port 4173 in CI, a per-worktree port locally, `PW_PORT` overrides; never reuses a running server), where `/api/chat` doesn't
exist, so every chat scenario mocks the endpoint with scripted SSE, and the show runs scripted
(automation gets no LLM). No test here calls a real model. Specs about today's site open
`NORMAL_SITE` (`?retro=0`, `support.ts`; the default since the show stopped starting on its own).
Screenshots land in `web-check/` (git-ignored); CI uploads them as an artifact and sessions attach
them to the ticket.

Known limit: Playwright is pinned to `~1.56.0` because the cloud container's preinstalled Chromium
is revision 1194; bumping it needs `executablePath: '/opt/pw-browsers/chromium'` or a new container
image.

Security headers (`securityHeaders.spec.ts`): `vite preview` sends the production headers from `scripts/securityHeaders.ts`, so every web check runs under the enforcing CSP; Chromium logs a CSP violation as a console error, which `collectErrors` already fails on; a spec proves it. Another spec checks `vercel.json` → `headers` equals the module. The voice agent's part
(docs/voice/SYSTEM_DESIGN.md §10): `connect-src` is `'self'` plus exactly the ElevenLabs and LiveKit
origins, `script-src` stays `'self'`, Chromium allows the microphone on the page and still blocks the
camera, and `api/voice-session.ts` gets `maxDuration: 30`.
