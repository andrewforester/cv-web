# e2e

Why it exists: the last gate before a change reaches visitors. It proves that the production
build actually starts and works in a real browser, in both languages, which unit tests in jsdom
can't: a green build can still crash at startup. It is the *web check* in the root `AGENTS.md`
and the `web-smoke` job in CI.

What it guarantees today:
- Both Forest pages, `/` (the CV) and `/new` (the profile), load directly in English and
  Ukrainian browsers with no page or console errors and fit a phone screen without horizontal
  scrolling (desktop and 390 px screenshots); the language switch works and survives a reload.
- The chat answers a question with a streamed reply, and rate limiting shows its notice. A `#ask`
  link opens it; its Forest look is screenshotted empty and answered, desktop and phone, EN + UK.
- The page agent: asking the chat to show a section scrolls and highlights it; opening a contact
  asks for confirmation and does nothing on Cancel.

Place in the architecture: runs against `vite preview` of `dist/`, where `/api/chat` doesn't
exist, so every chat scenario mocks the endpoint with scripted SSE. No test here calls a real
model. Screenshots land in `web-check/` (git-ignored); CI uploads them as an artifact and sessions
attach them to the ticket.
