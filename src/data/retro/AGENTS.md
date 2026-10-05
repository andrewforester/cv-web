# data/retro

Why it exists: the data side of the Retro Rebuild show. The CV opens as a broken 2000s site and an
"agent" fixes it live, step by step, while an LLM comments on each step and answers the visitor in
a terminal chat. This package holds what the browser and the server must agree on: which steps the
show has and what they mean, the `/api/chat` `v: 3` show dialect, and the seam the show uses to
talk to the LLM. Design: `docs/retro/ARCHITECTURE.md`, `docs/adr/0003-retro-live-fix-show.md`,
`docs/design/retro/SPEC.md`; wire contract: `docs/chat/API.md` → v3.

Domain terms:
- **Scenario / step:** the authored fix sequence of the page, 8 steps with one concern each
  (`fonts`, `colours`, `layout`, `images`, `cards`, `spacing`, `chrome`, `links`). The manifest has ids, console titles, an intent line for the LLM and a scripted
  fallback per step. What a step *does* to the page (its chunks: damage layers, decorations,
  modules) lives in the retro screen.
- **Scenario registry** (`scenarios.ts`, ARCHITECTURE §11): every known scenario by its wire id
  with its manifest; one today, `retro-4` (`scenario.ts`), the show on the one v3 page. Replies
  ground in that page's knowledge. The browser and the server both read it, so a registered id is
  known on both sides; the per-page `retro-3` and `retro-new-1` of before are unknown now.
- **Narration:** one commentary line per step plus the `finale`, fetched once per show
  (`narrate`); a missing line falls back to the manifest text, so the show never waits on the LLM.
- **Reply:** the LLM's answer to a visitor message, with the step on screen as context.
- **Scenario id:** bumped whenever the steps change; an old tab then gets
  `unsupported_version` and goes scripted.

Place in the architecture: data layer. The retro screen's state holder reaches the repository
through its context; `src/app/AppProviders.tsx` binds the implementation. The scenario stays an
argument of each call (the wire carries it). `server/chat/show/` imports
`scenario.ts`, `scenarios.ts` and `contract.ts` (framework-free, `.js` specifiers); errors, usage and
chat messages are reused from `../chat/contract`.

Implementations: `HttpShowRepository` (the real one, over `/api/chat` `v: 3`, served by
`server/chat/show/`) and the scripted `FakeShowRepository` for tests and dev.

Stubs and limits: EN only, by decision. Change the contract only through the ticket that owns
it; breaking changes bump `v` or the scenario id.
