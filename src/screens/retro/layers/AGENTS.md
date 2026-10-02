# retro/layers

Why it exists: the broken 2002 look of the show, one concern in one place per file, drawn over
the Forest pages on their hooks and `--forest-*` tokens. Top level: `/`'s 32 files (CV-90, R23;
`docs/design/retro/SPEC.md` → Damage layers → Forest refit and The fix list;
`docs/design/retro/layers/` is a copy kept in step). `new/`: the 15 `/new`-only files (SPEC →
2001 `/new` → Damage layers; copies of `docs/design/retro/new/layers/`); `/new` also reuses 17
top-level files as they are, so a shared file is a two-page contract (guard 2 checks it on both
pages). A `new/` file may share an id with a top-level one: ids are unique per scenario. Each file is both applied (injected as
`<style data-retro-layer>`) and shown (typed into the console as one chunk), so it is written to
read well, kept short (≤ ~8 lines, a few up to 13) and formatted by Prettier.

Rules: token layers only redefine names from `src/theme/tokens.css`; rule layers start every
selector with `[data-retro-stage]` (or `body:has([data-retro-stage])`) and select only the hook
contract (`data-testid`, `data-agent-id`, element types, `:has()` on a hook), never Module classes
or `:nth-child`. Retro literals are allowed here and only here (see `../AGENTS.md`). No
`@keyframes` here: the layer host defines `retro-blink`. A new file must be registered in
its scenario's registry (`../scenario.ts` / `../scenarioNew.ts`) and removed by one chunk in its
fix list (`../scenarioSteps.ts` / `../scenarioNewSteps.ts`), with `morph` motion if it
changes something that can't interpolate (font family, `display`, flex direction/wrap, `width`,
`content`, images); the guards fail otherwise. No two layers set the same property on the same
element, and every rule must change something visible on Forest (no-op rules mislead the visitor).
