import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nContext } from './I18nContext';
import { initialLocale, type Locale } from './locale';

interface I18nProviderProps {
  children: ReactNode;
  /** Overrides detection; used by tests. */
  initial?: Locale;
}

export function I18nProvider({ children, initial }: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>(() => initial ?? initialLocale());

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale }), [locale]);

  return <I18nContext value={value}>{children}</I18nContext>;
}
