# retro/layers

Why it exists: the broken 2002 look of the show, one concern per file, copied from
`docs/design/retro/layers/`. Each file is both applied (injected as `<style data-retro-layer>`)
and shown (typed into the console), so it is written to read well and formatted by Prettier.

Rules: token layers only redefine names from `src/theme/tokens.css`; rule layers start every
selector with `[data-retro-stage]` (or `body:has([data-retro-stage])`) and select only the hook
contract (`data-testid`, `data-agent-id`, element types, `:has()` on a hook), never Module classes
or `:nth-child`. Retro literals are allowed here and only here (see `../AGENTS.md`). A new file
must be registered in `../scenario.ts` and removed by a step; the guards fail otherwise.
