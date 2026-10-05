# i18n

Why it exists: the site is English only (ADR-0006 Decision 6; the Ukrainian strings stay until Cleanup),
and every UI text a visitor reads goes through this small typed mechanism, so a missing or misspelled key fails the
type check instead of showing up on the page. No library.

Behaviour the visitor sees: the language is always English: `initialLocale()` ignores the browser
language and any stored choice, and there is no language switcher. Untranslated texts fall back to
English.

Place in the architecture: provided by `src/app/AppProviders.tsx`. Each screen owns its strings
namespace in `src/screens/<screen>/strings.ts`; the shared `common` namespace (loading/error, the shared Show case button) belongs to Theme. CV content is not strings: it comes localized from `src/data`.
