# app

App shell and wiring. Owner: Scaffold (screens may only register their own route here).

- `AppProviders.tsx`: i18n provider + the data binding (`CvRepositoryContext` ←
  `StaticCvRepository`). To plug in a backend, change that one line. Accepts `repository` and
  `locale` props so tests can inject fakes.
- `App.tsx`: layout: header with the shared `LanguageSwitcher` (wired to `useLocale()`), then the
  home screen. There is no router yet: one page. Add one when a second page appears.
- `App.test.tsx`: switching EN → UA changes every text, `<html lang>` and the stored choice.

Entry point: `src/main.tsx` (imports `src/theme/global.css`, renders `<AppProviders><App/>`).
