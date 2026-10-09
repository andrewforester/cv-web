import type { Motion } from './motionKit';

/** Hover effects need a mouse: no tilt or spotlight on touch screens. */
const FINE_HOVER = '(hover: hover) and (pointer: fine)';
/** The tilted card's 3D look (SPEC §4): perspective, top tilt and side tilt per unit, lift. */
const PERSPECTIVE = 'perspective(800px)';
const TILT_X_DEG = 8;
const TILT_Y_DEG = 10;
const LIFT = -4;

/** Whether the hover effects may run (a fine pointer that hovers). */
export function hoverAllowed(): boolean {
  return window.matchMedia(FINE_HOVER).matches;
}

/**
 * Animations that follow the cursor on one element: each new one starts from where the last left
 * off, and the browser drops those fully covered by newer ones. `clear` cancels the rest, back to
 * the element's own styles.
 */
function follower(el: Element) {
  let trail: Animation[] = [];
  const clear = () => {
    trail.forEach((animation) => animation.cancel());
    trail = [];
  };
  const to = (keyframe: Keyframe, options: KeyframeAnimationOptions) => {
    const animation = el.animate([keyframe], { fill: 'forwards', ...options });
    trail = [...trail.filter(({ replaceState }) => replaceState !== 'removed'), animation];
    return animation;
  };
  /** Clears once `animation` finishes, unless a newer one has started since. */
  const clearAfter = (animation: Animation) => {
    animation.onfinish = () => trail.at(-1) === animation && clear();
  };
  return { to, clear, clearAfter };
}

/** Adds `listeners` to `el` until the motion stops, then runs `cleanup`. */
function listen(
  motion: Motion,
  el: Element,
  listeners: Record<'mousemove' | 'mouseleave', (event: MouseEvent) => void>,
  cleanup: () => void,
): void {
  const entries = Object.entries(listeners) as [string, (event: Event) => void][];
  entries.forEach(([type, fn]) => el.addEventListener(type, fn));
  motion.onStop(() => {
    entries.forEach(([type, fn]) => el.removeEventListener(type, fn));
    cleanup();
  });
}

/**
 * 3D tilt towards the cursor (SPEC §4), only once the card's reveal has finished; it eases back
 * flat on leave and then hands the card back to its own styles.
 */
export function tilt(motion: Motion, el: Element | null): void {
  if (!el) return;
  const { tokens } = motion;
  const { to, clear, clearAfter } = follower(el);
  const transform = (x: number, y: number, lift: number) =>
    `${PERSPECTIVE} rotateX(${(-y * TILT_X_DEG).toFixed(2)}deg) ` +
    `rotateY(${(x * TILT_Y_DEG).toFixed(2)}deg) translateY(${lift}px)`;
  listen(
    motion,
    el,
    {
      mousemove: ({ clientX, clientY }) => {
        if (!motion.isSettled(el)) return;
        const box = el.getBoundingClientRect();
        if (!box.width || !box.height) return;
        const x = (clientX - box.left) / box.width - 0.5;
        const y = (clientY - box.top) / box.height - 0.5;
        to(
          { transform: transform(x, y, LIFT) },
          { duration: tokens.durationTilt, easing: 'ease-out' },
        );
      },
      mouseleave: () => {
        if (!motion.isSettled(el)) return;
        clearAfter(
          to(
            { transform: transform(0, 0, 0) },
            { duration: tokens.durationSettle, easing: tokens.ease },
          ),
        );
      },
    },
    clear,
  );
}

/**
 * The cursor spotlight inside `panel` (SPEC §2, loop): `spot` follows the cursor with a lag and
 * fades out when it leaves.
 */
export function spotlight(motion: Motion, panel: Element | null, spot: Element | null): void {
  if (!panel || !(spot instanceof HTMLElement)) return;
  const { tokens } = motion;
  const { to, clear } = follower(spot);
  listen(
    motion,
    panel,
    {
      mousemove: ({ clientX, clientY }) => {
        const box = panel.getBoundingClientRect();
        const x = clientX - box.left - spot.offsetWidth / 2;
        const y = clientY - box.top - spot.offsetHeight / 2;
        to(
          { opacity: 1, transform: `translate(${x}px, ${y}px)` },
          { duration: tokens.durationFollow, easing: 'ease-out' },
        );
      },
      mouseleave: () => {
        to({ opacity: 0 }, { duration: tokens.durationSettle, easing: 'ease-out' });
      },
    },
    clear,
  );
}
