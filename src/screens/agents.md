# screens

One folder per screen: `src/screens/<screen>/`. Each holds:

- `<Screen>UiState.ts`: the immutable UI state type.
- `use<Screen>State.ts`: state holder; reads data through `src/data` repositories.
- `<Screen>Screen.tsx` (+ `.module.css`): stateless, `state` in, callbacks out.
- `<Screen>Route.tsx`: connects the state holder to the screen; the app shell renders it.
- `strings.ts`: the screen's `<screen>` strings namespace (`defineStrings`).
- `testIds.ts`, and at least one `*.test.tsx` UI test.
- `agents.md`.

Screens: `cv/` (the CV page, root of the site).
