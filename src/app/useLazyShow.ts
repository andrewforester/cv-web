import { useEffect, useState } from 'react';
import type { RetroShowRoute } from '../screens/retro/RetroShowRoute';

export interface LazyShow {
  /** The show's route once its chunk has loaded; the shell renders it. */
  Show: typeof RetroShowRoute | null;
}

/**
 * The Retro Rebuild show as a lazy chunk, requested only when `wanted` (show mode), so normal-mode
 * visitors never download it. Returns the route once loaded; a failed chunk (offline, a deploy
 * swapped the chunks) calls `onFailed` instead, and the shell falls back to the normal site.
 */
export function useLazyShow(wanted: boolean, onFailed: () => void): LazyShow {
  const [Show, setShow] = useState<LazyShow['Show']>(null);

  useEffect(() => {
    if (!wanted || Show) return;
    let active = true;
    import('../screens/retro/RetroShowRoute').then(
      (module) => {
        if (active) setShow(() => module.RetroShowRoute);
      },
      () => {
        if (active) onFailed();
      },
    );
    return () => {
      active = false;
    };
  }, [wanted, Show, onFailed]);

  return { Show };
}
