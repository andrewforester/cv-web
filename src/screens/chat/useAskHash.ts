import { useEffect } from 'react';

/** The link target that opens the chat ("Live AI CV — ask it anything" on `/new`). */
export const ASK_HASH = '#ask';

/**
 * Calls `onAsk` when the URL hash is `#ask`, on load or on `hashchange`, then clears the hash
 * without a history entry, so the same link works again (Forest SPEC → Decision 3).
 * `onAsk` must be stable.
 */
export function useAskHash(onAsk: () => void): void {
  useEffect(() => {
    const check = () => {
      if (window.location.hash !== ASK_HASH) return;
      const { pathname, search } = window.location;
      history.replaceState(history.state, '', pathname + search);
      onAsk();
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, [onAsk]);
}
