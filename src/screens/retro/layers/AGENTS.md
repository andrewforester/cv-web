# retro/layers

Why it exists: the broken 2002 look of the show, one concern in one place per file (32 files),
drawn over the Forest `/` on its hooks and `--forest-*` tokens (CV-90, R23; the fix list and what
each file holds are `docs/design/retro/SPEC.md` → Damage layers → Forest refit and The fix list;
`docs/design/retro/layers/` is a copy kept in step). Each file is both applied (injected as
`<style data-retro-layer>`) and shown (typed into the console as one chunk), so it is written to
read well, kept short (≤ ~8 lines, a few up to 13) and formatted by Prettier.

Rules: token layers only redefine names from `src/theme/tokens.css`; rule layers start every
selector with `[data-retro-stage]` (or `body:has([data-retro-stage])`) and select only the hook
contract (`data-testid`, `data-agent-id`, element types, `:has()` on a hook), never Module classes
or `:nth-child`. Retro literals are allowed here and only here (see `../AGENTS.md`). No
`@keyframes` here: the layer host defines `retro-blink`. A new file must be registered in
`../scenario.ts` and removed by one chunk in `../scenarioSteps.ts`, with `morph` motion if it
changes something that can't interpolate (font family, `display`, flex direction/wrap, `width`,
`content`, images); the guards fail otherwise. No two layers set the same property on the same
element, and every rule must change something visible on Forest (no-op rules mislead the visitor).
