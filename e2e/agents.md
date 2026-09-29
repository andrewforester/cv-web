# e2e

Playwright web smoke check (*web check* in `CLAUDE.md`). Runs against the production build served
by `vite preview` at `http://localhost:4173/` (config: `playwright.config.ts`).

- `smoke.spec.ts`: the CV page renders in EN and UA (UA shows English texts until translated) (browser locale `en-US` / `uk-UA`), sets
  `<html lang>`, has no `pageerror` or console errors; the switcher changes the language and the
  choice survives a reload. Screenshots: `web-check/home-en.png`, `web-check/home-uk.png`
  (git-ignored; CI uploads them as `web-smoke-screenshots`).
- `chat.spec.ts`: the chat widget with `/api/chat` mocked by `page.route` (canned SSE body): open
  the FAB, ask a suggested question, the streamed answer renders (with bold) in EN and UK, the
  request carries the locale, no console errors; a platform `429` shows the rate-limit notice.
  Screenshots `web-check/chat-{en,uk}.png`.
