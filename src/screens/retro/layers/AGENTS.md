# retro/layers

Why it exists: the broken 2002 look of the show, one concern in one place per file (32 files),
copied from `docs/design/retro/layers/` and re-pointed at the Forest `/` (GRA-89: Forest hooks and
tokens, the old values; the design copies still target the old CV; R23 redesigns the damage, see
`docs/retro/ARCHITECTURE.md` §9 → Round 6). Each file is both applied (injected as
`<style data-retro-layer>`) and shown (typed into the console as one chunk), so it is written to
read well, kept short (≤ ~8 lines, a few up to 13) and formatted by Prettier.

Rules: token layers only redefine names from `src/theme/tokens.css`; rule layers start every
selector with `[data-retro-stage]` (or `body:has([data-retro-stage])`) and select only the hook
contract (`data-testid`, `data-agent-id`, element types, `:has()` on a hook), never Module classes
or `:nth-child`. Retro literals are allowed here and only here (see `../AGENTS.md`). No
`@keyframes` here: the layer host defines `retro-blink`. A new file must be registered in
`../scenario.ts` and removed by one chunk in `../scenarioSteps.ts`, with `morph` motion if it
changes something that can't interpolate (font family, `display`, layout, `content`, images); the
guards fail otherwise.
