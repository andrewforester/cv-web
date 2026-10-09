import { countUp } from './countUp';
import { side, up, type Motion } from './motionKit';
import { find, findAll, motionTargets as t } from './motionTargets';

/** The headline's gradient word drifts across a gradient twice its width (SPEC §1). */
function drift(gradient: string): Keyframe[] {
  const base = { backgroundImage: gradient, backgroundSize: '200% 100%' };
  return [
    { ...base, backgroundPosition: '0% 50%' },
    { ...base, backgroundPosition: '100% 50%' },
  ];
}

/**
 * The intro on load (SPEC §1): meta bar, photo, name, headline (clip reveal + skew, then its
 * gradient word drifts for good), summary, stat tiles with their values counting up, contact
 * buttons. Delays and offsets are the design's choreography; durations and easings are tokens.
 */
export function playHomeIntro(motion: Motion, root: ParentNode): void {
  const { tokens } = motion;
  motion.once(
    find(root, t.nav),
    [
      { opacity: 0, transform: 'translateY(-12px)' },
      { opacity: 1, transform: 'none' },
    ],
    { duration: tokens.durationShort },
  );
  motion.once(
    find(root, t.avatar),
    [
      { opacity: 0, transform: 'scale(0.5) rotate(-12deg)', filter: 'blur(8px)' },
      { opacity: 1, transform: 'none', filter: 'blur(0px)' },
    ],
    { duration: tokens.durationLong, delay: 100, easing: tokens.spring },
  );
  motion.once(find(root, t.names), side(-24), { delay: 250 });
  motion.once(
    find(root, t.headline),
    [
      { opacity: 0, transform: 'translateY(0.45em) skewY(4deg)', clipPath: 'inset(0 0 100% 0)' },
      { opacity: 1, transform: 'none', clipPath: 'inset(-20% -5% -20% -5%)' },
    ],
    { duration: tokens.durationHeadline, delay: 300 },
  );
  findAll(root, t.accent).forEach((word) =>
    motion.run(word, drift(tokens.gradientLoop), {
      duration: tokens.driftDuration,
      iterations: Infinity,
      direction: 'alternate',
      easing: 'ease-in-out',
      fill: 'none',
    }),
  );
  motion.once(find(root, t.lead), up(24), { delay: 550 });
  findAll(root, t.stat).forEach((stat, i) => {
    motion.once(stat, up(30, 0.92), { delay: 650 + i * 90 });
    countUp(motion, find(stat, t.count), 750 + i * 90);
  });
  findAll(root, t.button).forEach((button, i) =>
    motion.once(button, up(16, 0.96), { delay: 900 + i * 70 }),
  );
}
