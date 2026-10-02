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
  On `/new` the chat offers `/new`'s own four questions in both languages (`chat-new-{en,uk}.png`)
  and sends `page: "profile"` with the `/new` route; `/` keeps today's questions.
- The page agent: asking the chat to show a section scrolls and highlights it, and the next
  question's page snapshot names that section in view and the highlighted target; opening a contact
  asks for confirmation and does nothing on Cancel.
  On `/new` the same tools work over `/new`'s sections (a scripted scroll to "Selected impact").
- The Retro Rebuild show on `/` (`retro.spec.ts`, docs/retro/ARCHITECTURE.md §1 guards 3 and 4;
  §9 → Guards after the split; helpers in `retroShow.ts` take a page's `ShowUrls`, §10): on the
  fake clock it runs all 36 chunks to the end and leaves exactly the
  normal page (computed styles of every element, `html` and `body` classes compared with `?retro=0`;
  no stage, layer, motion style, decoration, window or inline token left; AI chat button present);
  after every chunk, the command the DevTools console printed is what the page has (each
  `style.setProperty` value is the computed token, removed layer styles and decorations gone, chat
  button rendered), the 8 step groups open in order and the counters end at 0. Guards 3 and 4 run with `reducedMotion: 'reduce'`: the
  fake clock drives the runner but not CSS or view transitions. One extra run with motion on
  (real view transitions) reaches the same end state with no console errors, and is the timing
  smoke: the show ends within 110 s of show time (≈ 91 s today) and not under 60 s. The show
  never starts on its own (only `?retro=1`, or the Show case button `forest-show-case` in the meta
  bar). The intro: the broken page alone, then the agent chat with its two lines, then DevTools;
  each step's narration is a `//` comment above its first command and the chat stays silent.
  While it runs, the agent chat is the site's chat card (title, no IRC lines, the Forest chat's
  Onest despite the damage token layers), the page reserves the 400 px dock, and the highlight's plate names the
  targets (`p.name × N`: the name and the section titles, then `body 880 × 800` for the page-wide chunk).
- The same show on `/new` (`retroNew.spec.ts`, `PROFILE_SHOW_URLS`, ARCHITECTURE §10): at t = 0
  the profile is the broken 2001 page alone (32 layers, the three decorations with `/new`'s copy,
  no meta bar or dock; `retro-new-start.png`, compared with `docs/design/retro/new/screenshot.png`);
  guard 4 per chunk (`retro-new-mid.png`) and guard 3 against `/new?retro=0` (`retro-new-end.png`)
  through the same helpers (`expectShownIsApplied`, `expectEndsAsNormalSite`); the motion-on run
  with the same 60–110 s timing smoke; and the Show case button in `/new`'s meta bar starts it
  (stage on, `/new`'s layers in, ✖ 36).
- The show is a lazy chunk (`retroLazy.spec.ts`): `?retro=0` never requests it; in show mode no
  frame of today's design is painted before the broken page; a failed chunk leaves the normal site.

Place in the architecture: runs against `vite preview` of `dist/` (port 4173 in CI, a per-worktree port locally, `PW_PORT` overrides; never reuses a running server), where `/api/chat` doesn't
exist, so every chat scenario mocks the endpoint with scripted SSE, and the show runs scripted
(automation gets no LLM). No test here calls a real model. Specs about today's site open
`NORMAL_SITE` (`?retro=0`, `support.ts`; the default since the show stopped starting on its own).
Screenshots land in `web-check/` (git-ignored); CI uploads them as an artifact and sessions attach
them to the ticket (`retro-intro.png` with the chat's two intro lines, `retro-mid.png` after step
4's first chunk with its narration comment, `retro-end.png` from the reduced-motion run,
`retro-loading.png` and `retro-first-frame.png` for the show).
