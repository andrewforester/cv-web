import { createContext, useContext } from 'react';
import type { Locale } from './locale';

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useLocale(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useLocale must be used inside <I18nProvider>');
  return value;
}
