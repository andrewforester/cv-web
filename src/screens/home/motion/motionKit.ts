import type { MotionTokens } from './motionTokens';

/** Reveal on scroll (SPEC → Global settings): fires as soon as any part is 10 % above the bottom. */
const REVEAL_OPTIONS: IntersectionObserverInit = { threshold: 0, rootMargin: '0px 0px -10% 0px' };

/**
 * One run of the page's motion: every animation, timer, frame, observer and listener it starts,
 * so `stop` can undo all of it (cancelled animations leave the elements' own styles).
 */
export interface Motion {
  tokens: MotionTokens;
  /** Plays once; when it finishes its effect is removed, so hover and other styles apply again. */
  once: (el: Element | null, keyframes: Keyframe[], options?: KeyframeAnimationOptions) => void;
  /** Starts an animation that stays (a loop, or one scrubbed by scroll) until `stop`. */
  run: (
    el: Element | null,
    keyframes: Keyframe[],
    options?: KeyframeAnimationOptions,
  ) => Animation | null;
  /** Calls `fn` after `ms`. */
  later: (fn: () => void, ms: number) => void;
  /** Calls `fn` on the next animation frame. */
  frame: (fn: FrameRequestCallback) => void;
  /** Calls `fn` the first time `target` scrolls into view, then stops watching it. */
  onReveal: (target: Element, fn: () => void) => void;
  /** Adds a step to `stop` (listeners to remove, text to restore). */
  onStop: (fn: () => void) => void;
  /** Ends everything; safe to call more than once. */
  stop: () => void;
}

/** `up(y, s)`: fades in while rising `y` px and growing from scale `s`. */
export function up(y: number, s = 1): Keyframe[] {
  return [
    { opacity: 0, transform: `translateY(${y}px) scale(${s})` },
    { opacity: 1, transform: 'none' },
  ];
}

/** `side(x, r)`: fades in while sliding `x` px and turning from `r` degrees. */
export function side(x: number, r = 0): Keyframe[] {
  return [
    { opacity: 0, transform: `translateX(${x}px) rotate(${r}deg)` },
    { opacity: 1, transform: 'none' },
  ];
}

/** Starts a run; its defaults are the tokens' `EASE` and duration, filled both ways. */
export function createMotion(tokens: MotionTokens): Motion {
  const animations: Animation[] = [];
  const timers: number[] = [];
  const frames: number[] = [];
  const stops: (() => void)[] = [];
  const reveals = new Map<Element, (() => void)[]>();
  let stopped = false;
  let observer: IntersectionObserver | null = null;

  const run: Motion['run'] = (el, keyframes, options) => {
    if (!el || stopped) return null;
    const animation = el.animate(keyframes, {
      duration: tokens.duration,
      easing: tokens.ease,
      fill: 'both',
      ...options,
    });
    animations.push(animation);
    return animation;
  };

  const reveal = (entries: IntersectionObserverEntry[]) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      observer?.unobserve(target);
      const fns = reveals.get(target) ?? [];
      reveals.delete(target);
      fns.forEach((fn) => fn());
    });
  };

  return {
    tokens,
    run,
    once: (el, keyframes, options) => {
      const animation = run(el, keyframes, options);
      if (animation) animation.onfinish = () => animation.cancel();
    },
    later: (fn, ms) => {
      if (!stopped) timers.push(window.setTimeout(fn, ms));
    },
    frame: (fn) => {
      if (!stopped) frames.push(requestAnimationFrame(fn));
    },
    onReveal: (target, fn) => {
      if (stopped) return;
      observer ??= new IntersectionObserver(reveal, REVEAL_OPTIONS);
      const fns = reveals.get(target);
      if (fns) fns.push(fn);
      else {
        reveals.set(target, [fn]);
        observer.observe(target);
      }
    },
    onStop: (fn) => {
      stops.push(fn);
    },
    stop: () => {
      if (stopped) return;
      stopped = true;
      observer?.disconnect();
      reveals.clear();
      timers.forEach((timer) => clearTimeout(timer));
      frames.forEach((frame) => cancelAnimationFrame(frame));
      animations.forEach((animation) => animation.cancel());
      stops.forEach((fn) => fn());
    },
  };
}
