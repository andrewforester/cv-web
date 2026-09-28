# home

Hello screen (placeholder until the real CV screen Issues): shows a greeting, the CV owner's name
and professional title in the current language.

- `useHomeState()` loads `Cv` via `useCvRepository().getCv(locale)` and re-loads on language
  change → `HomeUiState` (`loading` | `error` | `ready {name, title}`).
- `HomeScreen` renders that state; loading/error texts come from `common`, the greeting from the
  `home` namespace (`strings.ts`). Name/title are CV data (localized JSON in `src/data/mock`).
- `HomeRoute` glues the two; `App` renders it under the header.
- Test ids: `testIds.ts`. Tests: `HomeRoute.test.tsx` (fake repository: ready and error).
