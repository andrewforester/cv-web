import { useContext, useState } from 'react';
import { useLocale } from '../i18n';
import { readRetroMode, type RetroMode } from './retroMode';
import { RetroModeContext } from './RetroModeContext';

/** The mode, decided once per page load (the seam first, then the URL, locale and viewport). */
export function useRetroMode(): RetroMode {
  const forced = useContext(RetroModeContext);
  const { locale } = useLocale();
  const [mode] = useState(() => forced ?? readRetroMode(locale));
  return mode;
}
