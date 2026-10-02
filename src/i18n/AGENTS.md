# i18n

Why it exists: the site is bilingual (English and Ukrainian, shown as "UA"), and every UI text a
visitor reads goes through this small typed mechanism, so a missing or misspelled key fails the
type check instead of showing up on the page. No library.

Behaviour the visitor sees: the language is the stored choice, else the browser language, else
English; the choice persists and is mirrored into `<html lang>`. Untranslated texts fall back to
English.

Place in the architecture: provided by `src/app/AppProviders.tsx`. Each screen owns its strings
namespace in `src/screens/<screen>/strings.ts`; the shared `common` namespace (switcher labels,
loading/error, the shared Show case button) belongs to Theme. CV content is not strings: it comes localized from `src/data`.
