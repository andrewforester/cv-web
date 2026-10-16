import { useEffect, useState } from 'react';

/**
 * Keeps an element mounted for `exitMs` after `open` turns false, so it can play its close
 * animation. `closing` is true during that time.
 */
export function usePresence(open: boolean, exitMs: number): { mounted: boolean; closing: boolean } {
  const [previousOpen, setPreviousOpen] = useState(open);
  const [closing, setClosing] = useState(false);

  if (previousOpen !== open) {
    setPreviousOpen(open);
    setClosing(!open);
  }

  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => setClosing(false), exitMs);
    return () => clearTimeout(timer);
  }, [closing, exitMs]);

  return { mounted: open || closing, closing };
}
