# test

Vitest setup shared by all unit/UI tests (`vite.config.ts` → `test.setupFiles`).

- `setup.ts`: registers jest-dom matchers, unmounts rendered trees and clears `localStorage` after
  each test (the i18n provider persists the locale there).

Tests live next to the code they test (`*.test.ts(x)` under `src/`).
