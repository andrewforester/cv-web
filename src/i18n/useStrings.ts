import { useLocale } from './I18nContext';
import type { Strings } from './strings';

/** Returns the current locale's texts of a strings namespace. */
export function useStrings<T extends Record<string, string>>(
  namespace: Strings<T>,
): { [K in keyof T]: string } {
  const { locale } = useLocale();
  return namespace[locale];
}
