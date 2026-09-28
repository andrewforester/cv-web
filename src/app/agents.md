# app

App shell and wiring. Owner: Scaffold (screens may only register their own route here).

- `AppProviders.tsx`: i18n provider + the data binding (`CvRepositoryContext` ←
  `StaticCvRepository`). To plug in a backend, change that one line. Accepts `repository` and
  `locale` props so tests can inject fakes.
- `App.tsx`: layout: header with the shared `LanguageSwitcher` (wired to `useLocale()`), then the
  CV screen (`CvRoute`). The shell is `--content-max-width` wide plus `--page-gutter` each side.
  There is no router yet: one page. Add one when a second page appears.
- `App.test.tsx`: switching EN → UA sets `<html lang>` and the stored choice; untranslated texts
  stay English.

Entry point: `src/main.tsx` (imports `src/theme/global.css`, renders `<AppProviders><App/>`).
