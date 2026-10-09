import { useEffect, useRef } from 'react';

/** The hash of the history entries the chat's sheets add, so the system Back steps out of them. */
export const CHAT_HASH = '#chat';

/**
 * In sheet mode the open sheets own `depth` history entries (`#chat`; the text sheet and the call
 * sheet one each, the chat over the call two): Back removes one and `onBack` steps the chat out of
 * one view; when the depth drops by other means the extra entries are popped again, so none is
 * left behind. Outside sheet mode history is untouched. A page loaded with `#chat` just has the
 * hash cleared. `onBack` must be stable.
 */
export function useChatHistoryEntry(depth: number, sheet: boolean, onBack: () => void): void {
  const owned = useRef(0);
  /** Pops this hook asked for itself: their `popstate` is not a Back. */
  const ownPops = useRef(0);

  useEffect(() => {
    if (window.location.hash !== CHAT_HASH) return;
    const { pathname, search } = window.location;
    history.replaceState(history.state, '', pathname + search);
  }, []);

  const wanted = sheet ? depth : 0;
  // After every render: the entries can drift from the depth with no dependency changing (Back
  // cancels a connecting call that started in the text sheet: one entry wanted before and after).
  useEffect(() => {
    // Entries are added only in sheet mode; leaving it keeps them until the chat steps out.
    if (wanted > owned.current) {
      const { pathname, search } = window.location;
      for (; owned.current < wanted; owned.current += 1) {
        history.pushState(history.state, '', pathname + search + CHAT_HASH);
      }
    } else if (depth < owned.current) {
      const extra = owned.current - depth;
      owned.current = depth;
      ownPops.current += 1;
      history.go(-extra);
    }
  });

  useEffect(() => {
    const onPopState = () => {
      if (ownPops.current > 0) {
        ownPops.current -= 1;
        return;
      }
      if (owned.current === 0) return;
      owned.current -= 1;
      onBack();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [onBack]);
}
