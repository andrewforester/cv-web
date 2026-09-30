# e2e

Why it exists: the last gate before a change reaches visitors. It proves that the production
build actually starts and works in a real browser, in both languages, which unit tests in jsdom
can't: a green build can still crash at startup. It is the *web check* in the root `AGENTS.md`
and the `web-smoke` job in CI.

What it guarantees today:
- The CV page renders in English and Ukrainian browsers, the language switch works and survives a
  reload, and there are no page or console errors.
- The chat answers a question with a streamed reply, and rate limiting shows its notice.
- The page agent: asking the chat to show a section scrolls and highlights it; opening a contact
  asks for confirmation and does nothing on Cancel.
- The Retro Rebuild show (`retro.spec.ts`, docs/retro/ARCHITECTURE.md §1 guards 3 and 4): on the
  fake clock it runs to the end and leaves exactly the normal page (computed styles of every
  element compared with `?retro=0`, nothing of the show left, AI chat button present); after every
  step, what the console printed for it is what the page has (token values live, layer styles and
  decorations gone, chat button rendered); reduced motion still ends clean; only English desktop
  visitors get it, once per browser session.

Place in the architecture: runs against `vite preview` of `dist/`, where `/api/chat` doesn't
exist, so every chat scenario mocks the endpoint with scripted SSE, and the show runs scripted
(automation gets no LLM). No test here calls a real model. An English desktop browser gets the
show by default, so specs about today's site open `NORMAL_SITE` (`?retro=0`, `support.ts`).
Screenshots land in `web-check/` (git-ignored); CI uploads them as an artifact and sessions attach
them to the ticket (`retro-mid.png` after step 4, `retro-end.png` for the show).
