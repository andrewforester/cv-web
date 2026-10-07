# retro

Why it exists: the Retro Rebuild show (the Show case). When the visitor asks for it the one CV page (v3) turns
into a broken 2002 homepage; an agent chat in the site's own AI chat look says "That's how this CV
would look like in 2001." and "Now let's fix it.", then Chrome DevTools (light theme) docks to the
right and the "agent" fixes the site live in its Console, its commentary typed as `//` comments
while the chat stays quiet: every command it types is what changes the page, until the page is
today's page and the real AI chat button loads; the ✖ / ⚠ counters fall from 36 / 8 to 0. At the end
DevTools collapses, the chat says "All good now." and then shrinks into the site's chat launcher.
Design: `docs/design/retro/SPEC.md` (look, copy, timing; the 2001 look was designed for the retired `/new`; the current part is "v3 refit"); mechanism: `docs/retro/ARCHITECTURE.md`,
`docs/adr/0003-retro-live-fix-show.md`.

Domain terms:
- **Damage layer** (`layers/*.css`): one CSS file that breaks one thing, injected as
  `<style data-retro-layer>`. Token layers redefine design tokens on `:root`; rule layers select
  only stable hooks under `[data-retro-stage]`. The console removes a rule layer with
  `querySelector('style[data-retro-layer=…]').remove()` and replaces a token layer with
  `style.setProperty` calls carrying the site's live values (set inline on `<html>` until the end).
- **Decoration**: show-owned DOM over the page (nav bar + marquee, footer, "Oh, snap!" note),
  rendered through a portal, `aria-hidden`, its DOM id = its id.
- **Source** (`scenario.ts`, ARCHITECTURE §11): what the one scenario, `retro-4`, does to the
  page: its damage layers, decorations, modules, the decorations' anchors (`home`, `home-header`,
  `home-photo`) and copy, in `RETRO_SOURCE`.
- **Step / chunk** (`scenarioSteps.ts` holds the fix list, written with `chunkBuilders.ts`): 8
  manifest steps of 36 chunks. A step opens with its **narration comment**
  (the LLM line or the manifest fallback, wrapped into `// …` lines) typed into the console. A chunk is one visible change: one effect
  (remove a layer or decoration, load a module: the AI chat is the last chunk), its **target**
  (the `// → <label>` console line and what the highlight marks) and its **motion** (`fade`,
  `morph`; decorations leave). Each chunk types on its own clock, applies at its last character
  and gets a 1 s beat (≈ 91 s show).
- **Stage**: the shell carrying `data-retro-stage` while the show runs (owned by `src/app`, R5).
- **Motion / highlight / camera** (SPEC → Transitions, Show what changed; GRA-52): a fade chunk
  switches CSS transitions on for its window (`RetroMotion.module.css`, a `body` class), a morph
  chunk removes its layer inside a view transition (a class on `<html>`; the dock, decorations and
  highlight stay live); the show's own highlight marks the chunk's target as DevTools' Elements tab
  does (box model, and a plate naming the element with its live size; a tint for page-wide
  chunks) and its camera scrolls to it unless the visitor scrolled lately; at the end DevTools
  slides out (`undocked`) and later the chat closes into the chat launcher (`closing`).
- **Token shield**: the dock re-declares every site token with its live value (read once at the
  start), so the token layers on `:root` never restyle the agent chat.

Place in the architecture: a screen mounted by the shell next to the unchanged page:
`RetroShowRoute` (props: the page's scenario, module loaders, `onDone`) picks the scenario's
source → `RetroShowRun` → `useRetroShowState` (runner, layer host,
`ShowRepository` from `src/data/retro` for LLM narration and replies) → stateless
`RetroShowScreen` (dock with the DevTools panel `LiveConsole` and the floating `AgentChat`,
`Decorations`, `Highlight`) in a portal into `document.body`. The agent chat is built from the
site chat's stateless pieces in `src/shared/chat/`; only its composer is show-local. `engine/` is
the framework-free runner. The end state is always zero layers, zero decorations: the real site;
the shell then drops the stage.

Rules and limits:
- **Tokens-only exception:** `layers/*.css` and `Decorations.module.css` hardcode retro colours,
  fonts and sizes on purpose: they are the displayed "old code" and the 2002 furniture, and they
  leave with the show. Everything else (the dock, the agent chat, the DevTools panel, the
  highlight) uses only tokens plus a few panel metrics as screen-local custom properties
  (`--console-*` in `LiveConsole.module.css`, the chat card's 280 px console minimum, the plate's
  padding).
- The DevTools chrome (tabs, filter bar, counters) is decoration: `aria-hidden`, not clickable; the
  log is `role="log"` with one live announcement per finished step.
- The engine still writes `system` chat entries for offline and too long; the screen's mapping
  drops them (offline is the banner, a too-long draft can't be sent).
- The LLM's `finale` narration line is still fetched but not shown (Round 5: the close line is the
  fixed `All good now.`).
- The LLM is never on the critical path: missing narration → the manifest's fallback lines,
  failed replies → a scripted line; automation (`navigator.webdriver`) runs fully scripted.
- Guards: `scenario.test.ts` (every layer/decoration removed exactly
  once, every chunk has a target, motion fits the layer's CSS, every file under `layers/` is
  registered), `layers.test.tsx` (every rule-layer and target selector matches the real page in
  `RetroStageTestHarness`, every token exists), `engine/showTiming.test.ts` (≈ 91 s), and
  in `e2e/retro.spec.ts` guards 3 and 4. Renaming a page's hook or token fails them; fix
  the layer, never the guard.
- Tests import layer files with `?raw` like the app (`vite.config.ts` → `test.css.include`).
- Dev harness: `harness/` (not a build entry): `npm run dev`, then
  `/src/screens/retro/harness/index.html`.
- Motion never touches the page's screen: the classes live only for a chunk's window and go with the
  show. Reduced motion: no classes, no view transitions, no leave, instant close. Browsers without
  view transitions get morphs instantly (the highlight still shows where).
- Desktop only. Runs on the one page (`src/app/showScenarios.ts`). Started by the shell (`?retro=1` or its start seam); replay = start again (R24).
