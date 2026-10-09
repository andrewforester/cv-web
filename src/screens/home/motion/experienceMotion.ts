import { side, up, type Motion } from './motionKit';
import { find, findAll, motionTargets as t } from './motionTargets';

/** Grows a tree line from its start: `axis` Y from the top, X from the left. */
function grow(axis: 'X' | 'Y'): Keyframe[] {
  const transformOrigin = axis === 'Y' ? 'top' : 'left';
  return [
    { transformOrigin, transform: `scale${axis}(0)` },
    { transformOrigin, transform: `scale${axis}(1)` },
  ];
}

/**
 * "Experience" (SPEC §2): each job rises in, its logo springs up turning, its own points slide in
 * one by one; on Transcenda's tree each project's stem grows down, then its branch out, then the
 * project slides in.
 */
export function playExperience(motion: Motion, root: ParentNode): void {
  const { tokens } = motion;
  findAll(root, t.job).forEach((job) => {
    motion.reveal(job, job, up(40));
    motion.reveal(
      job,
      find(job, t.logo),
      [
        { opacity: 0, transform: 'scale(0.4) rotate(-20deg)' },
        { opacity: 1, transform: 'none' },
      ],
      { delay: 120, easing: tokens.spring },
    );
    Array.from(find(job, t.points)?.children ?? []).forEach((point, i) =>
      motion.reveal(job, point, side(-18), { delay: 220 + i * 80 }),
    );
  });
  findAll(root, t.project).forEach((project) => {
    motion.reveal(project, find(project, t.stem), grow('Y'), {
      duration: tokens.durationShort,
      easing: 'ease-out',
    });
    motion.reveal(project, find(project, t.branch), grow('X'), {
      duration: tokens.durationBranch,
      delay: 400,
      easing: 'ease-out',
    });
    motion.reveal(project, find(project, t.projectBody), side(30), { delay: 500 });
  });
}
