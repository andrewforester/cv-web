import { hoverAllowed, spotlight } from './hoverMotion';
import { clipFrom, up, type Motion } from './motionKit';
import { find, findAll, motionTargets as t } from './motionTargets';

/** The typewriter's steps over the loop's last line (SPEC §2). */
const TYPE_STEPS = 56;

/** A card of the loop lighting up and back (SPEC §2): pink border, glow and a lit fill at 30 %. */
function highlightRun({ tokens }: Motion): Keyframe[] {
  const rest = {
    borderColor: tokens.darkLine,
    boxShadow: '0 0 0 0 transparent',
    backgroundColor: 'transparent',
  };
  return [
    { offset: 0, ...rest },
    {
      offset: 0.3,
      borderColor: tokens.glowPink,
      boxShadow: `0 0 0 1px ${tokens.glowPink}, 0 14px 36px -12px ${tokens.glow}`,
      backgroundColor: tokens.glowSurface,
    },
    { offset: 1, ...rest },
  ];
}

/**
 * "How I build with agents" (SPEC §2): the dark panel opens from a rounded clip while rising, then
 * its lead and the steps come up; each step lights up once in turn; the last line types itself
 * out. The spotlight follows the cursor over the panel.
 */
export function playLoop(motion: Motion, root: ParentNode): void {
  const panel = find(root, t.panel);
  if (!panel) return;
  const { tokens } = motion;
  const [clipStart, clipEnd] = clipFrom(panel, '6% 3% 6% 3%');
  motion.reveal(
    panel,
    panel,
    [
      { opacity: 0, transform: 'translateY(60px) scale(0.94)', ...clipStart },
      { opacity: 1, transform: 'none', ...clipEnd },
    ],
    { duration: tokens.durationBlock },
  );
  motion.reveal(panel, find(panel, t.panelLead), up(24), { delay: 200 });
  const steps = findAll(panel, t.step);
  steps.forEach((step, i) => {
    motion.reveal(panel, step, up(28, 0.94), { delay: 350 + i * 110 });
    motion.playOnReveal(panel, step, highlightRun(motion), {
      duration: tokens.durationBlock,
      delay: 1100 + i * 220,
      easing: 'ease-out',
      fill: 'none',
    });
  });
  motion.reveal(
    panel,
    find(panel, t.footnote),
    [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }],
    {
      duration: tokens.durationType,
      delay: 400 + steps.length * 110,
      easing: `steps(${TYPE_STEPS}, end)`,
    },
  );
  if (hoverAllowed()) spotlight(motion, panel, find(panel, t.spotlight));
}
