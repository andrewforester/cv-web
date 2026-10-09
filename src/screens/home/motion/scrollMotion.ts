import type { Motion } from './motionKit';
import { find, findAll, motionTargets as t } from './motionTargets';

/** Scroll distance over which the header's stat tiles drift up (SPEC §3). */
const PARALLAX_DISTANCE = 900;
/** How far odd and even tiles drift, px. */
const PARALLAX_ODD = -70;
const PARALLAX_EVEN = -30;
/** Length of a scrubbed animation; only its progress matters. */
const SCRUB = 1000;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Whether the stat tiles sit beside the summary (wide layout). Stacked under it (phones), a tile
 * drifting up would cover the summary's last lines, so there is no parallax then. Horizontal
 * positions only: the drift moves the tiles vertically.
 */
function besideLead(lead: Element | null, stat: Element | undefined): boolean {
  if (!lead || !stat) return false;
  return stat.getBoundingClientRect().left >= lead.getBoundingClientRect().right;
}

/**
 * Scroll-linked motion (SPEC §3): the progress bar's width follows the scroll, and the header's
 * stat tiles drift up on top of their own transform (none on the headline or the photo) while they
 * sit beside the summary. Updated once per frame at most.
 */
export function trackScroll(motion: Motion, root: ParentNode): void {
  const bar = find(root, t.progress);
  const lead = find(root, t.lead);
  const stats = findAll(root, t.stat);
  const parallax = stats.map((stat, i) => {
    const shift = i % 2 ? PARALLAX_ODD : PARALLAX_EVEN;
    const animation = motion.run(
      stat,
      [{ transform: 'translateY(0px)' }, { transform: `translateY(${shift}px)` }],
      { duration: SCRUB, easing: 'linear', composite: 'add' },
    );
    animation?.pause();
    return animation;
  });

  let frame = 0;
  const update = () => {
    frame = 0;
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (bar instanceof HTMLElement) {
      bar.style.transform = `scaleX(${clamp01(window.scrollY / scrollable)})`;
    }
    const progress = besideLead(lead, stats[0]) ? clamp01(window.scrollY / PARALLAX_DISTANCE) : 0;
    parallax.forEach((animation) => {
      if (animation) animation.currentTime = progress * SCRUB;
    });
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  motion.onStop(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    cancelAnimationFrame(frame);
    if (bar instanceof HTMLElement) bar.style.transform = '';
  });
  update();
}
