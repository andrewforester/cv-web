import { useCallback, useLayoutEffect, useState } from 'react';
import { useLazyShow, type LazyShow } from './useLazyShow';

export interface ShowCase {
  /** The show is on: the shell carries the stage and renders `Show`. */
  showing: boolean;
  /** Page load with `?retro=1` while the show's chunk loads: the shell stays hidden meanwhile. */
  pending: boolean;
  Show: LazyShow['Show'];
  /** Starts the show (the Show case button, R24; again = replay). */
  start: () => void;
  /** The show ended or its chunk failed: back to today's site. */
  end: () => void;
}

/**
 * The seam that starts the Retro Rebuild show (docs/retro/ARCHITECTURE.md §9 → Round 5): at page
 * load when `atLoad` (`?retro=1`), otherwise when `start` is called. Today's site stays on screen
 * while the show's lazy chunk loads; then one commit puts the stage on, mounts the show (its damage
 * layers go in before paint) and scrolls to the top, so the broken page starts at its head.
 */
export function useShowCase(atLoad: boolean): ShowCase {
  const [wanted, setWanted] = useState(atLoad);
  const [cold] = useState(atLoad);
  const start = useCallback(() => setWanted(true), []);
  const end = useCallback(() => setWanted(false), []);
  const { Show } = useLazyShow(wanted, end);
  const showing = wanted && Show !== null;

  useLayoutEffect(() => {
    if (showing) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [showing]);

  return { showing, pending: cold && wanted && !Show, Show, start, end };
}
