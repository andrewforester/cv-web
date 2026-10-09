const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const PRINT = 'print';
/** The shell's wrapper while the Show case runs (`src/app/App.tsx`): the show owns the page then. */
const RETRO_STAGE = '[data-retro-stage]';

/**
 * Whether `el` may animate now: the browser has the Web Animations API and `matchMedia`, the
 * visitor hasn't asked for reduced motion, the page isn't printing and the Show case isn't on.
 */
export function motionAllowed(el: Element): boolean {
  if (typeof el.animate !== 'function' || typeof window.matchMedia !== 'function') return false;
  if (window.matchMedia(REDUCED_MOTION).matches || window.matchMedia(PRINT).matches) return false;
  return el.closest(RETRO_STAGE) === null;
}

/**
 * Calls `stop` once motion around `el` must end: before printing, when reduced motion is switched
 * on, or when the Show case puts its stage around the page. Returns the unsubscribe.
 */
export function watchMotionGate(el: Element, stop: () => void): () => void {
  const reduced = window.matchMedia(REDUCED_MOTION);
  const onReduced = () => reduced.matches && stop();
  const stage = new MutationObserver(() => el.closest(RETRO_STAGE) !== null && stop());
  window.addEventListener('beforeprint', stop);
  reduced.addEventListener('change', onReduced);
  stage.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-retro-stage'],
    subtree: true,
  });
  return () => {
    window.removeEventListener('beforeprint', stop);
    reduced.removeEventListener('change', onReduced);
    stage.disconnect();
  };
}
