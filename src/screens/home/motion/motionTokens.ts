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
  /** Sections (SPEC §2): the loop panel, the CTA and the loop cards' highlight run. */
  durationBlock: number;
  /** The loop's typewriter line. */
  durationType: number;
  /** A tree branch's horizontal line (its stem takes `durationShort`). */
  durationBranch: number;
  /** Hover (SPEC §4): tilt towards the cursor, the spotlight's lag, easing back / fading out. */
  durationTilt: number;
  durationFollow: number;
  durationSettle: number;
  ctaDriftDuration: number;
  /** The loop cards' highlight run: pink border, its glow and the lit fill; the dark rule at rest. */
  glowPink: string;
  glow: string;
  glowSurface: string;
  darkLine: string;
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
    durationBlock: parseDuration(read('--motion-duration-block')),
    durationType: parseDuration(read('--motion-duration-type')),
    durationBranch: parseDuration(read('--motion-duration-branch')),
    durationTilt: parseDuration(read('--motion-duration-tilt')),
    durationFollow: parseDuration(read('--motion-duration-follow')),
    durationSettle: parseDuration(read('--motion-duration-settle')),
    ctaDriftDuration: parseDuration(read('--motion-cta-drift-duration')),
    glowPink: read('--color-dark-number'),
    glow: read('--motion-glow'),
    glowSurface: read('--motion-glow-surface'),
    darkLine: read('--color-dark-line'),
    gradientLoop: read('--gradient-brand-loop'),
  };
  const complete = Object.values(tokens).every((value) =>
    typeof value === 'number' ? Number.isFinite(value) : value !== '',
  );
  return complete ? tokens : null;
}
