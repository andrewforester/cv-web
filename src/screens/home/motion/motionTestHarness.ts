import { vi } from 'vitest';

/** One `el.animate(...)` call seen by the fake Web Animations API. */
export interface AnimateCall {
  el: Element;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  animation: Animation & {
    cancel: ReturnType<typeof vi.fn>;
    play: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    finish: ReturnType<typeof vi.fn>;
  };
}

/** The motion tokens as `src/theme/tokens.css` has them (jsdom doesn't load the theme). */
const TOKENS: Record<string, string> = {
  '--motion-ease': 'cubic-bezier(0.16, 1, 0.3, 1)',
  '--motion-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  '--motion-duration': '900ms',
  '--motion-duration-short': '700ms',
  '--motion-duration-long': '1100ms',
  '--motion-duration-headline': '1300ms',
  '--motion-count-duration': '1400ms',
  '--motion-drift-duration': '3500ms',
  '--motion-duration-block': '1200ms',
  '--motion-duration-type': '1800ms',
  '--motion-duration-branch': '400ms',
  '--motion-duration-tilt': '250ms',
  '--motion-duration-follow': '500ms',
  '--motion-duration-settle': '600ms',
  '--motion-cta-drift-duration': '7000ms',
  '--color-dark-number': '#ff7acb',
  '--motion-glow': 'rgba(255, 79, 184, 0.55)',
  '--motion-glow-surface': 'rgba(255, 255, 255, 0.04)',
  '--color-dark-line': '#3a3248',
  '--gradient-brand-loop': 'linear-gradient(90deg, #ff4fb8, #8b5cf6, #ff4fb8)',
};

/** Where a watched element is when the fake IntersectionObserver reports it. */
type Place = 'in' | 'below' | 'above';

/**
 * Gives jsdom what the page's motion needs, for tests only: the motion tokens on `:root`,
 * `matchMedia` answering `reduce`, `print` and the hover pointer as asked, an IntersectionObserver
 * that reports what `scroll` says, and a recording `Element.animate` (`finish` ends at once).
 * Returns the recorded calls; `vi.restoreAllMocks` + `uninstall` undo it.
 */
export function installMotionEnv({ reduced = false, print = false, hover = true } = {}) {
  const calls: AnimateCall[] = [];
  const observers: { callback: IntersectionObserverCallback; watched: Set<Element> }[] = [];
  Object.entries(TOKENS).forEach(([name, value]) =>
    document.documentElement.style.setProperty(name, value),
  );
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches:
        (reduced && query.includes('reduce')) ||
        (print && query === 'print') ||
        (hover && query.includes('hover')),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn(function IntersectionObserverStub(callback: IntersectionObserverCallback) {
      const watched = new Set<Element>();
      observers.push({ callback, watched });
      return {
        observe: vi.fn((el: Element) => watched.add(el)),
        unobserve: vi.fn((el: Element) => watched.delete(el)),
        disconnect: vi.fn(() => watched.clear()),
      };
    }),
  );
  Element.prototype.animate = vi.fn(function animate(
    this: Element,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
  ) {
    const animation = {
      cancel: vi.fn(),
      pause: vi.fn(),
      play: vi.fn(),
      finish: vi.fn(() => animation.onfinish?.call(animation, new Event('finish') as never)),
      onfinish: null,
      currentTime: 0,
    } as unknown as AnimateCall['animation'];
    calls.push({ el: this, keyframes, options, animation });
    return animation;
  }) as unknown as Element['animate'];

  const uninstall = () => {
    Object.keys(TOKENS).forEach((name) => document.documentElement.style.removeProperty(name));
    vi.unstubAllGlobals();
    delete (Element.prototype as Partial<Element>).animate;
  };
  /** Reports `el` (if watched) as in view, still below or already scrolled past. */
  const scroll = (el: Element, place: Place = 'in') =>
    observers.forEach(({ callback, watched }) => {
      if (!watched.has(el)) return;
      const entry = {
        target: el,
        isIntersecting: place === 'in',
        boundingClientRect: { bottom: place === 'above' ? -10 : 500 },
        rootBounds: { top: 0 },
      } as unknown as IntersectionObserverEntry;
      callback([entry], {} as IntersectionObserver);
    });
  /** Whether any observer still watches `el`. */
  const watching = (el: Element) => observers.some(({ watched }) => watched.has(el));
  return { calls, uninstall, scroll, watching };
}
