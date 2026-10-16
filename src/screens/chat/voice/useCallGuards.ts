import { useEffect, useRef } from 'react';
import { useOnlineStatus } from '../useOnlineStatus';

interface CallGuards {
  /** The browser went offline: a live call ends as dropped (SPEC → Layout 5). */
  onOffline: () => void;
  /** The chat left the page (unmount): hang up. */
  onLeave: () => void;
}

/** Ends a call the visitor didn't end: connectivity lost, or the widget unmounted. */
export function useCallGuards({ onOffline, onLeave }: CallGuards): void {
  const online = useOnlineStatus();
  const latest = useRef({ onOffline, onLeave });
  useEffect(() => {
    latest.current = { onOffline, onLeave };
  });

  useEffect(() => {
    if (!online) latest.current.onOffline();
  }, [online]);

  useEffect(() => () => latest.current.onLeave(), []);
}
