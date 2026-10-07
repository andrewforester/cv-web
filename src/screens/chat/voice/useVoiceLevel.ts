import { useEffect, useRef, type RefObject } from 'react';

/**
 * Writes the call's loudness (0..1) to `--voice-level` on `target` once per animation frame
 * (docs/design/voice/SPEC.md → Motion): the orb and the fog follow it without a React render.
 */
export function useVoiceLevel(target: RefObject<HTMLElement | null>, level: () => number): void {
  const read = useRef(level);
  useEffect(() => {
    read.current = level;
  });

  useEffect(() => {
    let frame = requestAnimationFrame(function tick() {
      target.current?.style.setProperty('--voice-level', read.current().toFixed(3));
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [target]);
}
