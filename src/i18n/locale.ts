export const LOCALES = ['en', 'uk'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

const STORAGE_KEY = 'cv.locale';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Maps a BCP 47 tag like `uk-UA` to a supported locale, or `undefined`. */
export function matchLocale(tag: string | undefined): Locale | undefined {
  const language = tag?.toLowerCase().split('-')[0];
  return isLocale(language) ? language : undefined;
}

export function readStoredLocale(): Locale | undefined {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isLocale(stored) ? stored : undefined;
  } catch {
    return undefined;
  }
}

export function storeLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for the page only.
  }
}

/** Stored choice first, then the browser language, then the default. */
export function initialLocale(): Locale {
  return readStoredLocale() ?? matchLocale(navigator.language) ?? DEFAULT_LOCALE;
}
