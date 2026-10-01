# retro

Why it exists: the Retro Rebuild show. The CV opens as a broken 2002 homepage; an agent chat
appears on the right, then a Chrome DevTools console (light theme) where the "agent" fixes the site
live: every command it types is what changes the page, until the page is today's CV and the real
AI chat button loads; its ✖ / ⚠ counters fall from 36 / 8 to 0. Design: `docs/design/retro/SPEC.md` (look, copy, timing); mechanism:
`docs/retro/ARCHITECTURE.md`, `docs/adr/0003-retro-live-fix-show.md`.

Domain terms:
- **Damage layer** (`layers/*.css`): one CSS file that breaks one thing, injected as
  `<style data-retro-layer>`. Token layers redefine design tokens on `:root`; rule layers select
  only stable hooks under `[data-retro-stage]`. The console removes a rule layer with
  `querySelector('style[data-retro-layer=…]').remove()` and replaces a token layer with
  `style.setProperty` calls carrying the site's live values (set inline on `<html>` until the end).
- **Decoration**: show-owned DOM over the page (nav bar + marquee, footer, "Oh, snap!" note),
  rendered through a portal, `aria-hidden`, its DOM id = its id.
- **Step / chunk** (`scenario.ts` registers layers, decorations and modules; `scenarioSteps.ts`
  holds the fix list): 8 manifest steps of 36 chunks. A chunk is one visible change: one effect
  (remove a layer or decoration, load a module: the AI chat is the last chunk), its **target**
  (the `// → <label>` console line and what the highlight marks) and its **motion** (`fade`,
  `morph`; decorations leave). Each chunk types on its own clock, applies at its last character
  and gets a 1 s beat (≈ 92 s show).
- **Stage**: the shell carrying `data-retro-stage` while the show runs (owned by `src/app`, R5).
- **Motion / highlight / camera** (SPEC → Transitions, Show what changed; GRA-52): a fade chunk
  switches CSS transitions on for its window (`RetroMotion.module.css`, a `body` class), a morph
  chunk removes its layer inside a view transition (a class on `<html>`; the dock, decorations and
  highlight stay live); the show's own highlight marks the chunk's target and its camera scrolls
  to it unless the visitor scrolled lately; at the end the windows fly off (`closing`).

Place in the architecture: a screen mounted by the shell next to the unchanged `CvRoute`:
`RetroShowRoute` (props: module loaders, `onDone`) → `useRetroShowState` (runner, layer host,
`ShowRepository` from `src/data/retro` for LLM narration and replies) → stateless
`RetroShowScreen` (dock with the DevTools panel `LiveConsole` and `TerminalChat`, `Decorations`,
`Highlight`) in a
portal into `document.body`. `engine/` is the framework-free runner. The end state is always zero
layers, zero decorations: the real site; the shell then drops the stage and stores
`sessionStorage['retro.done']`.

Rules and limits:
- **Tokens-only exception:** `layers/*.css` and `Decorations.module.css` hardcode retro colours,
  fonts and sizes on purpose: they are the displayed "old code" and the 2002 furniture, and they
  leave with the show. Everything else (the dock, the windows, the DevTools panel, the highlight)
  uses only tokens plus a few window and panel metrics (`--console-*` in `LiveConsole.module.css`)
  and the highlight's 100 ms fill flash as screen-local custom properties (`TODO(theme)`).
- The DevTools chrome (tabs, filter bar, counters) is decoration: `aria-hidden`, not clickable; the
  log is `role="log"` with one live announcement per finished step.
- The LLM is never on the critical path: missing narration → the manifest's fallback lines,
  failed replies → a scripted line; automation (`navigator.webdriver`) runs fully scripted.
- Guards: `scenario.test.ts` (every layer/decoration removed exactly once, every chunk has a
  target, motion fits the layer's CSS), `layers.test.tsx` (every rule-layer and target selector
  matches the real CV, every token exists), and in `e2e/retro.spec.ts` guards 3 and 4. Renaming
  a CV hook or token fails them; fix the layer, never the guard.
- EN only by decision: `strings.ts` has no `uk` (it falls back to English).
- Tests import layer files with `?raw` like the app (`vite.config.ts` → `test.css.include`).
- Dev harness: `harness/` (not a build entry): `npm run dev`, then
  `/src/screens/retro/harness/index.html`.
- Motion never touches the CV screen: the classes live only for a chunk's window and go with the
  show. Reduced motion: no classes, no view transitions, no leave, instant close. Browsers without
  view transitions get morphs instantly (the highlight still shows where).
- Desktop only; later rounds: replay.
