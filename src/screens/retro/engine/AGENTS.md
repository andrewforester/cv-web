# retro/engine

Why it exists: the live-fix show must run the same way every time, never wait on the LLM or the
network, and never show code that isn't what changes the page. This folder is the runner that
guarantees it, free of React so it can be tested on a fake clock.

What it holds (ARCHITECTURE §2–§3, §9 → Round 3):
- a pure state machine `idle → intro → handoff → console → steps → finale → undock → outro →
  closing → done` over **show time**, which stands still while the tab is hidden (Round 5: two
  intro lines in the chat, DevTools, the steps with a silent chat, then DevTools collapses, the
  chat's closing line, the chat collapses). A step is `narrate` (its narration typed into the
  console as `// …` comments at 100 chars/s, then 0.6 s to read; the first chunk's input continues
  under them), then per
  **chunk** (one visible change) `type` → apply → `beat` (1 s), then `stepDone` (0.3 s). A chunk
  types on its own clock (100 chars/s, 0.6–1.3 s) and applies at its last character once the
  screen's camera has settled on its target (`focusSettled`, capped at 0.8 s; after a scroll `focusScrolling` makes it wait 0.5 s more). A
  chunk that targets an element also pauses typing 0.5 s after its selector line. Holds for a
  composing visitor (≤ 15 s) or a streaming reply (≤ 12 s) happen only at chunk boundaries;
- the **console plan**: per chunk one DevTools console input, its `// → <target>` comment and the
  command that does exactly what the apply does (remove the layer's `<style>`, `style.setProperty`
  with the site's live token values, remove a decoration, `await import()`), generated once at the
  start from the scenario (SPEC → DevTools console → Console commands);
- the **layer host** that injects and removes the damage layers and sets the token chunks' values
  inline on `<html>` (instantly, or as a morph inside a same-document view transition), owns the
  `retro-blink` keyframes, and reads live token values past the layers;
- selectors that turn the state into the console's rows (opening line, collapsed `✓ n/8` groups,
  the open group's prompt, echoes, `<· undefined`, `✓` and warning rows) and its ✖ / ⚠ counters
  (chunks and steps not done), the step announcement and what must be on the page, and, for the
  stage's motion, highlight and camera, the current chunk (`chunkSelectors.ts`).

Place in the architecture: used only by the retro screen's state holder (`../useShowRunner.ts`,
`../useRetroShowState.ts`), which owns the timers and page events. It knows ids, not files: the
screen's `scenario.ts` / `scenarioSteps.ts` pass the layers, chunks and modules in. Timing values
live in `timing.ts`.

Limits: one reply at a time; a module that hasn't loaded 5 s after its code is typed is skipped
(a warning row) and `done` still removes everything, inline tokens included. Until the screen dispatches
`focusSettled`, targeted chunks wait the 0.8 s cap (typing and its pause may take longer). `showTestRun.ts` drives the reducer like the
state holder does, for tests only.
