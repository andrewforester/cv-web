# shared

Components used by more than one screen (or by the app shell). Owner: Theme; a component starts in
its screen folder and moves here in its own PR once a second screen needs it.

One folder per component: `<Component>.tsx`, `<Component>.module.css`, `<Component>.test.tsx`.
Components are stateless: props in (first optional one is `className`), callbacks out, texts via
`useStrings`, styles via tokens only.

- `LanguageSwitcher/`: EN / UA toggle buttons (`aria-pressed` on the current one). The app shell
  (`src/app/App.tsx`) wires it to `useLocale()`. Test ids: `testIds.ts`.
