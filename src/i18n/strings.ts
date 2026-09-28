import type { Locale } from './locale';

/**
 * A strings namespace: one object per locale. The `en` object sets the keys; other locales may
 * translate some or all of them (an unknown key is a type error), missing ones fall back to `en`.
 */
export type Strings<T extends Record<string, string>> = { en: T } & Partial<
  Record<Exclude<Locale, 'en'>, { [K in keyof T]?: string }>
>;

export function defineStrings<T extends Record<string, string>>(strings: Strings<T>): Strings<T> {
  return strings;
}
