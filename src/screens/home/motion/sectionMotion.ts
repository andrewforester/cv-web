import { countOnReveal } from './countUp';
import { hoverAllowed, tilt } from './hoverMotion';
import { clipFrom, side, up, type Motion } from './motionKit';
import { find, findAll, motionTargets as t } from './motionTargets';

/** The attribute the page agent's highlight sets (`src/shared/agentTarget`). */
const AGENT_HIGHLIGHTED = 'data-agent-highlighted';

/** -1 for the left one of a pair, 1 for the right one. */
const sideOf = (i: number) => (i % 2 ? 1 : -1);

/** Craft cards come in from their own side, turning slightly (SPEC §2, highlight cards). */
function playCraft(motion: Motion, grid: Element | null, hover: boolean): void {
  if (!grid) return;
  findAll(grid, t.card).forEach((card, i) => {
    motion.reveal(grid, card, side(80 * sideOf(i), 2 * sideOf(i)), {
      duration: motion.tokens.durationLong,
      delay: 100 + i * 120,
    });
    if (hover) tilt(motion, card);
  });
}

/** Impact cards spring up from a tilt, then their figures count up. */
function playImpact(motion: Motion, grid: Element | null, hover: boolean): void {
  if (!grid) return;
  const { tokens } = motion;
  findAll(grid, t.card).forEach((card, i) => {
    motion.reveal(
      grid,
      card,
      [
        { opacity: 0, transform: 'translateY(70px) rotate(3deg) scale(0.9)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: tokens.durationLong, delay: i * 130, easing: tokens.spring },
    );
    countOnReveal(motion, grid, find(card, t.count), 200 + i * 130);
    if (hover) tilt(motion, card);
  });
}

/** Skill groups slide in from the left, row by row. */
function playSkills(motion: Motion, grid: Element | null): void {
  if (!grid) return;
  findAll(grid, t.skill).forEach((group, i) =>
    motion.reveal(grid, group, side(-30), { delay: (i % 2) * 90 + Math.floor(i / 2) * 110 }),
  );
}

/** The education and about-me cards come in from their sides; the book covers spring up. */
function playColumns(motion: Motion, row: Element | null, hover: boolean): void {
  if (!row) return;
  const { tokens } = motion;
  findAll(row, t.column).forEach((column, i) => {
    motion.reveal(row, column, side(60 * sideOf(i)), {
      duration: tokens.durationLong,
      delay: i * 120,
    });
    if (hover) tilt(motion, column);
  });
  findAll(row, t.badge).forEach((badge, i) =>
    motion.reveal(
      row,
      badge,
      [
        { opacity: 0, transform: 'translateY(40px) rotate(-14deg)' },
        { opacity: 1, transform: 'none' },
      ],
      { delay: 350 + i * 110, easing: tokens.spring },
    ),
  );
}

/**
 * The closing call to action opens from a rounded clip; then its arrow nudges up-right twice. Its
 * background drifts for good.
 */
function playCta(motion: Motion, cta: Element | null): void {
  if (!cta) return;
  const { tokens } = motion;
  const [clipStart, clipEnd] = clipFrom(cta, '10% 6% 10% 6%');
  motion.reveal(
    cta,
    cta,
    [
      { opacity: 0, transform: 'scale(0.92)', ...clipStart },
      { opacity: 1, transform: 'none', ...clipEnd },
    ],
    { duration: tokens.durationBlock },
  );
  motion.playOnReveal(
    cta,
    find(cta, t.arrow),
    [
      { transform: 'translate(0, 0)' },
      { transform: 'translate(6px, -6px)' },
      { transform: 'translate(0, 0)' },
    ],
    { delay: 900, iterations: 2, easing: 'ease-in-out', fill: 'none' },
  );
  const size = { backgroundSize: '220% 220%' };
  motion.run(
    cta,
    [
      { ...size, backgroundPosition: '0% 0%' },
      { ...size, backgroundPosition: '100% 100%' },
    ],
    {
      duration: tokens.ctaDriftDuration,
      iterations: Infinity,
      direction: 'alternate',
      easing: 'ease-in-out',
      fill: 'none',
    },
  );
}

/**
 * The sections below the header (SPEC §2), each once on its first scroll-in: headings rise, then
 * each block's own choreography. Cards tilt on hover once revealed (SPEC §4, mouse only).
 */
export function playSections(motion: Motion, root: ParentNode): void {
  const hover = hoverAllowed();
  findAll(root, t.section).forEach((section) =>
    motion.reveal(section, find(section, t.heading), up(30)),
  );
  playSkills(motion, find(root, t.skills));
  playCraft(motion, find(root, t.craft), hover);
  playImpact(motion, find(root, t.impact), hover);
  playColumns(motion, find(root, t.columns), hover);
  playCta(motion, find(root, t.cta));
}

/**
 * Whatever the page agent highlights is shown at once, with everything still waiting to reveal in
 * or around it: the visitor never sees an outline around an empty space.
 */
export function showHighlighted(motion: Motion, root: Element): void {
  const observer = new MutationObserver((mutations) =>
    mutations.forEach(({ target }) => {
      if (target instanceof Element && target.hasAttribute(AGENT_HIGHLIGHTED)) {
        motion.showNow(target);
      }
    }),
  );
  observer.observe(root, { attributes: true, attributeFilter: [AGENT_HIGHLIGHTED], subtree: true });
  motion.onStop(() => observer.disconnect());
}
