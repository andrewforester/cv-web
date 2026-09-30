# retro

Why it exists: the Retro Rebuild show. The CV opens as a broken 2002 homepage; a terminal-style
chat appears on the right, then a console where an "agent" fixes the site live: every line it
types is the code that changes the page, until the page is today's CV and the real AI chat button
loads. Design: `docs/design/retro/SPEC.md` (look, copy, timing); mechanism:
`docs/retro/ARCHITECTURE.md`, `docs/adr/0003-retro-live-fix-show.md`.

Domain terms:
- **Damage layer** (`layers/*.css`): one CSS file that breaks one thing, injected as
  `<style data-retro-layer>`. Token layers redefine design tokens on `:root`; rule layers select
  only stable hooks under `[data-retro-stage]`. The same string is typed in the console.
- **Decoration**: show-owned DOM over the page (nav bar + marquee, footer, "Oh, snap!" note),
  rendered through a portal, `aria-hidden`, its DOM id = its id.
- **Step / chunk** (`scenario.ts` registers layers, decorations and modules; `scenarioSteps.ts`
  holds the fix list): 8 manifest steps of 36 chunks. A chunk is one visible change: one effect
  (remove a layer or decoration, load a module: the AI chat is the last chunk), its **target**
  (the `// → <label>` console line and what the highlight marks) and its **motion** (`fade`,
  `morph`; decorations leave). Each chunk types on its own clock, applies at its last character
  and gets a 1 s beat (≈ 92 s show).
- **Stage**: the shell carrying `data-retro-stage` while the show runs (owned by `src/app`, R5).

Place in the architecture: a screen mounted by the shell next to the unchanged `CvRoute`:
`RetroShowRoute` (props: module loaders, `onDone`) → `useRetroShowState` (runner, layer host,
`ShowRepository` from `src/data/retro` for LLM narration and replies) → stateless
`RetroShowScreen` (dock with `LiveConsole` + `TerminalChat`, `Decorations`) in a portal into
`document.body`. `engine/` is the framework-free runner. The end state is always zero layers, zero
decorations: the real site; the shell then drops the stage and stores `sessionStorage['retro.done']`.

Rules and limits:
- **Tokens-only exception:** `layers/*.css` and `Decorations.module.css` hardcode retro colours,
  fonts and sizes on purpose: they are the displayed "old code" and the 2002 furniture, and they
  leave with the show. Everything else (the dock, the windows) uses only `--retro-*` tokens plus a
  few window metrics that are screen-local custom properties (`TODO(theme)`).
- The LLM is never on the critical path: missing narration → the manifest's fallback lines,
  failed replies → a scripted line; automation (`navigator.webdriver`) runs fully scripted.
- Guards: `scenario.test.ts` (every layer/decoration removed exactly once, every chunk has a
  target, motion fits the layer's CSS), `layers.test.tsx` (every rule-layer and target selector
  matches the real CV, every token exists), and in `e2e/retro.spec.ts` guards 3 and 4. Renaming
  a CV hook or token fails them; fix the layer, never the guard.
- EN only by decision: `strings.ts` has no `uk` (it falls back to English).
- Stubs: IBM Plex Mono isn't installed (the panels fall back to Courier New). Tests import layer
  files with `?raw` like the app (`vite.config.ts` → `test.css.include`).
- Dev harness: `harness/` (not a build entry): `npm run dev`, then
  `/src/screens/retro/harness/index.html`.
- Desktop only; later rounds: replay.
