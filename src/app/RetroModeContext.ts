import { createContext } from 'react';
import type { RetroMode } from './retroMode';

/** Test seam from `AppProviders`: a fixed mode instead of the one read from the window. */
export const RetroModeContext = createContext<RetroMode | undefined>(undefined);
