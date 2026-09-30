import { useEffect, useState } from 'react';
import type { RetroShowRoute } from '../screens/retro/RetroShowRoute';

/**
 * Awaited on its own: Vite wraps an `import()` together with a `.then` chained onto it in its
 * preload helper, so a failed CSS preload would skip handlers chained there and go uncaught.
 */
async function importShow() {
  const { RetroShowRoute } = await import('../screens/retro/RetroShowRoute');
  return RetroShowRoute;
}

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
    importShow().then(
      (route) => {
        if (active) setShow(() => route);
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
