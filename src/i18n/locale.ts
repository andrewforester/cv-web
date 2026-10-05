export const LOCALES = ['en', 'uk'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** The site is English only (ADR-0006 Decision 6): no stored choice, no browser detection. */
export function initialLocale(): Locale {
  return DEFAULT_LOCALE;
}
