# i18n

Why it exists: every UI text a visitor reads goes through this small typed mechanism, so texts
stay out of components and a missing or misspelled key fails the type check instead of showing up
on the page. No library. The site is English only (ADR-0006 Decision 6): each namespace is
`defineStrings({ en })` and `useStrings` returns its `en` object; there is no locale state, no
detection and no provider. Keeping the wrapper (rather than plain constants) leaves the call sites
unchanged if a language ever comes back.

Place in the architecture: imported directly by screens and shared components. Each screen owns
its strings namespace in `src/screens/<screen>/strings.ts`; the shared `common` namespace
(loading/error, the shared Show case button) belongs to Theme. CV content is not strings: it comes
from `src/data`. `<html lang="en">` is fixed in `index.html`.
