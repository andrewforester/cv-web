import { useLocale } from './I18nContext';
import type { Strings } from './strings';

/** Returns the current locale's texts of a strings namespace; untranslated keys fall back to `en`. */
export function useStrings<T extends Record<string, string>>(
  namespace: Strings<T>,
): { [K in keyof T]: string } {
  const { locale } = useLocale();
  if (locale === 'en') return namespace.en;
  return { ...namespace.en, ...namespace[locale] };
}
