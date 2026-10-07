import { useEffect, useRef } from 'react';

/** The hash of the history entry the full-screen chat adds, so the system Back closes it. */
export const CHAT_HASH = '#chat';

/**
 * In sheet mode (decided when the chat opens) the open chat owns one history entry, `#chat`:
 * Back removes it and `onBack` closes the chat; closing by other means pops the entry again so
 * none is left behind. Outside sheet mode history is untouched. A page loaded with `#chat` just
 * has the hash cleared. `onBack` must be stable.
 */
export function useChatHistoryEntry(isOpen: boolean, sheet: boolean, onBack: () => void): void {
  const owned = useRef(false);
  const sheetRef = useRef(sheet);
  useEffect(() => {
    sheetRef.current = sheet;
  });

  useEffect(() => {
    if (window.location.hash !== CHAT_HASH) return;
    const { pathname, search } = window.location;
    history.replaceState(history.state, '', pathname + search);
  }, []);

  useEffect(() => {
    if (isOpen && sheetRef.current && !owned.current) {
      const { pathname, search } = window.location;
      history.pushState(history.state, '', pathname + search + CHAT_HASH);
      owned.current = true;
    } else if (!isOpen && owned.current) {
      owned.current = false;
      history.back();
    }
  }, [isOpen]);

  useEffect(() => {
    const onPopState = () => {
      if (!owned.current) return;
      owned.current = false;
      onBack();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [onBack]);
}
