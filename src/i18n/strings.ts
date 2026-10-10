/**
 * A strings namespace: the site is English only (ADR-0006 → Decision 6), so one `en` object. The
 * wrapper keeps user-visible texts out of components and leaves room for a locale to come back.
 */
export interface Strings<T extends Record<string, string>> {
  en: T;
}

export function defineStrings<T extends Record<string, string>>(strings: Strings<T>): Strings<T> {
  return strings;
}
