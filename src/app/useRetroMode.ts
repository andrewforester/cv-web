import { useContext, useState } from 'react';
import { readRetroMode, type RetroMode } from './retroMode';
import { RetroModeContext } from './RetroModeContext';

/** The mode at page load, decided once (the seam first, then the URL). */
export function useRetroMode(): RetroMode {
  const forced = useContext(RetroModeContext);
  const [mode] = useState(() => forced ?? readRetroMode());
  return mode;
}
