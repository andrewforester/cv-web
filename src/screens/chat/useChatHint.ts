import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'cv.chat.hintSeen';
export const HINT_DELAY_MS = 2000;

function readSeen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function storeSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Storage unavailable: the in-memory flag still hides the hint for this page session.
  }
}

/**
 * First-visit hint next to the FAB: shown once per browser, 2 s after load, until dismissed or the
 * chat is opened (SPEC → Launcher / first-visit hint). No auto-hide.
 */
export function useChatHint(): { visible: boolean; markSeen: () => void } {
  const [visible, setVisible] = useState(false);
  const seen = useRef(false);

  useEffect(() => {
    if (readSeen()) return;
    const timer = setTimeout(() => {
      if (!seen.current) setVisible(true);
    }, HINT_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const markSeen = useCallback(() => {
    seen.current = true;
    storeSeen();
    setVisible(false);
  }, []);

  return { visible, markSeen };
}
