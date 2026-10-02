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
- The Retro Rebuild show (`retro.spec.ts`, docs/retro/ARCHITECTURE.md §1 guards 3 and 4; §9 →
  Guards after the split): on the fake clock it runs all 36 chunks to the end and leaves exactly the
  normal page (computed styles of every element, `html` and `body` classes compared with `?retro=0`;
  no stage, layer, motion style, decoration, window or inline token left; AI chat button present);
  after every chunk, the command the DevTools console printed is what the page has (each
  `style.setProperty` value is the computed token, removed layer styles and decorations gone, chat
  button rendered), the 8 step groups open in order and the counters end at 0. Guards 3 and 4 run with `reducedMotion: 'reduce'`: the
  fake clock drives the runner but not CSS or view transitions. One extra run with motion on
  (real view transitions) reaches the same end state with no console errors, and is the timing
  smoke: the show ends within 110 s of show time (≈ 91 s today) and not under 60 s. The show
  never starts on its own (only `?retro=1`, or the shell's start function, which has no button
  yet). The intro: the broken page alone, then the agent chat with its two lines, then DevTools;
  each step's narration is a `//` comment above its first command and the chat stays silent.
  While it runs, the agent chat is the site's chat card (title, no IRC lines, Inter despite the
  damage token layers), the page reserves the 400 px dock, and the highlight's plate names the
  targets (`h1.name × N`, then `body 880 × 800` for the page-wide chunk).
- The show is a lazy chunk (`retroLazy.spec.ts`): `?retro=0` never requests it; in show mode no
  frame of today's design is painted before the broken page; a failed chunk leaves the normal site.

Place in the architecture: runs against `vite preview` of `dist/`, where `/api/chat` doesn't
exist, so every chat scenario mocks the endpoint with scripted SSE, and the show runs scripted
(automation gets no LLM). No test here calls a real model. Specs about today's site open
`NORMAL_SITE` (`?retro=0`, `support.ts`; the default since the show stopped starting on its own).
Screenshots land in `web-check/` (git-ignored); CI uploads them as an artifact and sessions attach
them to the ticket (`retro-intro.png` with the chat's two intro lines, `retro-mid.png` after step
4's first chunk with its narration comment, `retro-end.png` from the reduced-motion run,
`retro-loading.png` and `retro-first-frame.png` for the show).
