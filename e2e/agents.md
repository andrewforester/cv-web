# e2e

Playwright web smoke check (*web check* in `CLAUDE.md`). Runs against the production build served
by `vite preview` at `http://localhost:4173/` (config: `playwright.config.ts`).

- `smoke.spec.ts`: the home page renders in EN and UA (browser locale `en-US` / `uk-UA`), sets
  `<html lang>`, has no `pageerror` or console errors; the switcher changes the language and the
  choice survives a reload. Screenshots: `web-check/home-en.png`, `web-check/home-uk.png`
  (git-ignored; CI uploads them as `web-smoke-screenshots`).
