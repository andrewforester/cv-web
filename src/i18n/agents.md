# i18n

Small typed in-house i18n (no library). Locales `en` and `uk` (shown as "UA" in the switcher).

- `locale.ts`: `Locale`, detection (stored choice in `localStorage` key `cv.locale` →
  `navigator.language` → `en`), persistence.
- `I18nProvider.tsx` + `I18nContext.ts`: current locale and `setLocale`; mirrors the locale into
  `<html lang>` and saves it.
- `strings.ts`: `defineStrings({ en: {...}, uk: {...} })`: one namespace, `en` sets the keys, a
  missing `uk` key fails `tsc`.
- `useStrings(namespace)`: the current locale's texts.
- `common.ts`: shared `common` namespace (switcher labels, loading/error). Owner: Theme.

Each screen keeps its own namespace in `src/screens/<screen>/strings.ts`. CV content is data, not
strings: it comes localized from `src/data`.
