# retro/engine

Why it exists: the live-fix show must run the same way every time, never wait on the LLM or the
network, and never show code that isn't what changes the page. This folder is the runner that
guarantees it, free of React so it can be tested on a fake clock.

What it holds (ARCHITECTURE §2–§3):
- a pure state machine `idle → chat → console → steps (narrate → type → settle) → finale → done`
  over **show time**, which stands still while the tab is hidden; holds for a composing visitor
  (≤ 15 s) or a streaming reply (≤ 12 s) only at safe points (before typing, between steps);
- the **console plan**: the text typed per effect, generated once at the start from the scenario
  (rule layers verbatim, token layers as a diff against the site's live `:root` values);
- the **layer host** that injects and removes the damage layers, and reads live token values past
  them;
- selectors that turn the state into console lines, progress and what must be on the page.

Place in the architecture: used only by the retro screen's state holder (`../useShowRunner.ts`,
`../useRetroShowState.ts`), which owns the timers and page events. It knows ids, not files: the
screen's `scenario.ts` passes the layers, steps and modules in. Timing values live in `timing.ts`.

Limits: one reply at a time; a module that hasn't loaded 5 s after its code is typed is skipped
(`// skipped: …`) and `done` still removes everything. `showTestRun.ts` drives the reducer like the
state holder does, for tests only.
