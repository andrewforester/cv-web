import type { Locale } from './locale';

/**
 * A strings namespace: one object per locale with the same keys. The `en` object sets the shape,
 * so a key missing in `uk` is a type error.
 */
export type Strings<T extends Record<string, string>> = { en: T } & Record<
  Exclude<Locale, 'en'>,
  { [K in keyof T]: string }
>;

export function defineStrings<T extends Record<string, string>>(strings: Strings<T>): Strings<T> {
  return strings;
}
