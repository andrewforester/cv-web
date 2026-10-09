import { useLayoutEffect, type RefObject } from 'react';

/** When the launcher rises in and when its pulse starts, ms after page load (SPEC §1). */
const ENTRY_DELAY = 1500;
const PULSE_DELAY = 2600;
/** The ring pulses exactly this many times, then stops (the human, 2026-10-09). */
export const PULSE_COUNT = 2;
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
/** The shell's wrapper while the Show case runs: no intro there. */
const RETRO_STAGE = '[data-retro-stage]';

/** Reads the launcher's motion tokens; `null` when the theme isn't loaded (unit tests). */
function readTokens() {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string) => style.getPropertyValue(name).trim();
  const tokens = {
    spring: read('--motion-spring'),
    duration: Number.parseFloat(read('--motion-duration')),
    pulseDuration: Number.parseFloat(read('--motion-pulse-duration')),
    pulseColor: read('--motion-pulse-color'),
    pulseColorEnd: read('--motion-pulse-color-end'),
    pulseSpread: read('--motion-pulse-spread'),
    shadow: read('--shadow-launcher'),
  };
  const complete = Object.values(tokens).every((v) => (typeof v === 'number' ? v > 0 : v !== ''));
  return complete ? tokens : null;
}

function allowed(el: Element): boolean {
  return (
    typeof el.animate === 'function' &&
    typeof window.matchMedia === 'function' &&
    !window.matchMedia(REDUCED_MOTION).matches &&
    !window.matchMedia('print').matches &&
    el.closest(RETRO_STAGE) === null
  );
}

/**
 * The launcher's intro on page load (docs/design/motion/SPEC.md §1, Orchestrator decision 2): the
 * row rises in, then a violet ring pulses out of the pill twice, on top of its own shadow. Timed
 * from page load, not from mount: a launcher that comes back after the chat closes picks up the
 * same timeline (nothing left to play after a few seconds) instead of replaying it.
 */
export function useLauncherIntro(
  rowRef: RefObject<HTMLElement | null>,
  pillRef: RefObject<HTMLElement | null>,
): void {
  useLayoutEffect(() => {
    const row = rowRef.current;
    const pill = pillRef.current;
    if (!row || !pill || !allowed(row)) return;
    const tokens = readTokens();
    const since = performance.now();
    if (!tokens || since > PULSE_DELAY + PULSE_COUNT * tokens.pulseDuration) return;

    const entry = row.animate(
      [
        { opacity: 0, transform: 'translateY(40px) scale(0.8)' },
        { opacity: 1, transform: 'none' },
      ],
      {
        duration: tokens.duration,
        delay: ENTRY_DELAY - since,
        easing: tokens.spring,
        fill: 'both',
      },
    );
    entry.onfinish = () => entry.cancel();
    const pulse = pill.animate(
      [
        { boxShadow: `${tokens.shadow}, 0 0 0 0 ${tokens.pulseColor}` },
        { boxShadow: `${tokens.shadow}, 0 0 0 ${tokens.pulseSpread} ${tokens.pulseColorEnd}` },
      ],
      {
        duration: tokens.pulseDuration,
        delay: PULSE_DELAY - since,
        iterations: PULSE_COUNT,
        easing: 'ease-out',
        fill: 'none',
      },
    );
    return () => {
      entry.cancel();
      pulse.cancel();
    };
  }, [rowRef, pillRef]);
}
