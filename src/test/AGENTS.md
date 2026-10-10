# test

Why it exists: keeps unit and UI tests independent of each other. Shared Vitest setup
(registered in `vite.config.ts`) adds the DOM matchers and, after every test, unmounts what was
rendered and clears `localStorage`, where the chat hint persists.

Tests themselves live next to the code they test (`*.test.ts(x)` under `src/`).

Stack: Vitest + Testing Library + jest-dom (jsdom, globals on). Wrap components in `AppProviders`
(props `repository`, `locale` for fakes). CSS Modules in Vitest use non-scoped class names.
