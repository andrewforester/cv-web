# retro/engine

Why it exists: the live-fix show must run the same way every time, never wait on the LLM or the
network, and never show code that isn't what changes the page. This folder is the runner that
guarantees it, free of React so it can be tested on a fake clock.

What it holds (ARCHITECTURE §2–§3, §9 → Round 3):
- a pure state machine `idle → chat → console → steps → finale → closing → done` over **show
  time**, which stands still while the tab is hidden. A step is `narrate` (0.6 s), then per
  **chunk** (one visible change) `type` → apply → `beat` (1 s), then `stepDone` (0.3 s). A chunk
  types on its own clock (240 chars/s, 0.4–1.3 s) and applies at its last character once the
  screen's camera has settled on its target (`focusSettled`, capped at 0.8 s). Holds for a
  composing visitor (≤ 15 s) or a streaming reply (≤ 12 s) happen only at chunk boundaries;
- the **console plan**: per chunk its `// → <target>` line and code, generated once at the start
  from the scenario (rule layers verbatim, token layers as a diff against the site's live `:root`);
- the **layer host** that injects and removes the damage layers (instantly, or as a morph inside a
  same-document view transition), owns the `retro-blink` keyframes, and reads live token values
  past the layers;
- selectors that turn the state into console lines, progress and what must be on the page, and,
  for the stage's motion, highlight and camera, the current chunk (`chunkSelectors.ts`).

Place in the architecture: used only by the retro screen's state holder (`../useShowRunner.ts`,
`../useRetroShowState.ts`), which owns the timers and page events. It knows ids, not files: the
screen's `scenario.ts` / `scenarioSteps.ts` pass the layers, chunks and modules in. Timing values
live in `timing.ts`.

Limits: one reply at a time; a module that hasn't loaded 5 s after its code is typed is skipped
(`// skipped: …`) and `done` still removes everything. Until the screen dispatches
`focusSettled`, targeted chunks wait the 0.8 s cap. `showTestRun.ts` drives the reducer like the
state holder does, for tests only.
