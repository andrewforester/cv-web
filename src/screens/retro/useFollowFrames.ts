import { useLayoutEffect, useRef } from 'react';

/** Covers the longest change motion (`--retro-morph-duration` 500 ms) plus a margin. */
const FOLLOW_MS = 600;

/**
 * Calls `onFrame` every animation frame for a moment after `moving` turns on (a fade or a morph
 * just applied), so what sits on the page's targets follows them while they move, then stops.
 */
export function useFollowFrames(moving: boolean, onFrame: () => void) {
  const callback = useRef(onFrame);
  useLayoutEffect(() => {
    callback.current = onFrame;
  });
  useLayoutEffect(() => {
    if (!moving) return;
    let start: number | null = null;
    const follow = (now: number) => {
      start ??= now;
      callback.current();
      if (now - start < FOLLOW_MS) frame = requestAnimationFrame(follow);
    };
    let frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, [moving]);
}
