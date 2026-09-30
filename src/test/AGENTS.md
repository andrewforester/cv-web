# test

Why it exists: keeps unit and UI tests independent of each other. Shared Vitest setup
(registered in `vite.config.ts`) adds the DOM matchers and, after every test, unmounts what was
rendered and clears `localStorage`, where the language choice and the chat hint persist.

Tests themselves live next to the code they test (`*.test.ts(x)` under `src/`).
