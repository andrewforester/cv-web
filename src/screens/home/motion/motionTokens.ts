/** The CV page's motion tokens (`src/theme/tokens.css` → CV page motion) in the form the Web Animations API takes. */
export interface MotionTokens {
  /** `EASE`: the default easing. */
  ease: string;
  /** `SPRING`: the overshooting easing. */
  spring: string;
  /** Default duration, ms; the meta bar's is short, the photo's long, the headline's longest. */
  duration: number;
  durationShort: number;
  durationLong: number;
  durationHeadline: number;
  countDuration: number;
  scrambleDuration: number;
  driftDuration: number;
  /** The brand gradient that loops back to its first colour (the H1 accent drift). */
  gradientLoop: string;
}

/** A token's duration in ms (`900ms`, `1.4s`); `NaN` when it isn't one. */
export function parseDuration(value: string): number {
  if (value.endsWith('ms')) return Number.parseFloat(value);
  if (value.endsWith('s')) return Number.parseFloat(value) * 1000;
  return Number.NaN;
}

/**
 * Reads the tokens from `:root`. `null` when one is missing or broken (the theme isn't loaded, as
 * in unit tests): the page then doesn't move at all.
 */
export function readMotionTokens(root: Element = document.documentElement): MotionTokens | null {
  const style = getComputedStyle(root);
  const read = (name: string) => style.getPropertyValue(name).trim();
  const tokens: MotionTokens = {
    ease: read('--motion-ease'),
    spring: read('--motion-spring'),
    duration: parseDuration(read('--motion-duration')),
    durationShort: parseDuration(read('--motion-duration-short')),
    durationLong: parseDuration(read('--motion-duration-long')),
    durationHeadline: parseDuration(read('--motion-duration-headline')),
    countDuration: parseDuration(read('--motion-count-duration')),
    scrambleDuration: parseDuration(read('--motion-scramble-duration')),
    driftDuration: parseDuration(read('--motion-drift-duration')),
    gradientLoop: read('--gradient-brand-loop'),
  };
  const complete = Object.values(tokens).every((value) =>
    typeof value === 'number' ? Number.isFinite(value) : value !== '',
  );
  return complete ? tokens : null;
}
