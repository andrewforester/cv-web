import { useCallback, useSyncExternalStore } from 'react';

/** The full-screen sheet layout (SPEC: viewport < 600 px wide or < 500 px tall); mirrored in CSS. */
export const CHAT_SHEET_QUERY = '(max-width: 599px), (max-height: 499px)';

/** Whether a media query matches; `false` where `matchMedia` is missing (jsdom). */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window.matchMedia !== 'function') return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
    () => false,
  );
}
