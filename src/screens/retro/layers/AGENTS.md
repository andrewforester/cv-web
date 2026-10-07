# retro/layers

Why it exists: the broken 2002 look of the show, one concern in one place per file, drawn over
the one CV page (v3) on its `home-*` hooks and v3 tokens (`--color-*`, `--type-*`, `--font-*`,
`--gradient-*`). The 32 files of `retro-4` (docs/retro/ARCHITECTURE.md §11): the 2001 look, originally designed for the retired `/new`
(`docs/design/retro/SPEC.md` → Damage layers (`/new`)), refitted to the v3 page (SPEC → v3
refit lists every selector that moved and the rules added for the v3 blocks). Each file is both
applied (injected as `<style data-retro-layer>`) and shown (typed into the console as one chunk),
so it is written to read well, kept short (≤ ~8 lines, a few up to 16) and formatted by Prettier.

Rules: token layers only redefine names from `src/theme/tokens.css`; rule layers start every
selector with `[data-retro-stage]` (or `body:has([data-retro-stage])`) and select only the hook
contract (`data-testid`, element types, `:has()` on a hook, a hook's direct child), never Module
classes or `:nth-child`. The page's layout metrics (`--page-*`, `--card-*`, `--tree-*`, ...) are
theme tokens, so a layer may redefine them like any other token. Retro literals are allowed here
and only here (see `../AGENTS.md`).
No `@keyframes` here: the layer host defines `retro-blink`. A new file must be registered in
`../scenario.ts` and removed by one chunk in `../scenarioSteps.ts`, with `morph` motion if it
changes something that can't interpolate (font family, `display`, grid templates, `width`,
`content`, images, a gradient token); the guards fail otherwise. No two layers set the same
property on the same element, and every rule must change something visible on the page (no-op
rules mislead the visitor).
