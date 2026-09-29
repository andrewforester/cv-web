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
- `agent.spec.ts`: the page agent with `/api/chat` mocked to script a v2 tool round (`tool_call`
  then `done: tool_use`, and a text answer for the follow-up that carries `toolResults`). In EN and
  UK: "show the apps" scrolls the `section:apps` target into view, the action chip and the answer
  appear, the follow-up carries the call id, no console errors; `highlightElement` on the same
  target; `openContact` shows the confirmation card and Cancel opens nothing (`window.open` is
  spied, the URL is unchanged). Screenshots `web-check/agent-{en,uk}.png`. These tests need
  `AgentToolRegistry` bound to the chat (`useAgentExecutor`); without it every tool answers
  `not_available`.
