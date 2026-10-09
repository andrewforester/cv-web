/**
 * Names of the page parts the motion moves, set as `data-motion` (`motionTarget(...)`). They are
 * separate from the test ids, which are the Show case's contract.
 */
export const motionTargets = {
  nav: 'nav',
  avatar: 'avatar',
  names: 'names',
  headline: 'headline',
  /** The headline's gradient word. */
  accent: 'accent',
  lead: 'lead',
  stat: 'stat',
  /** A stat's value, counted up. */
  count: 'count',
  button: 'button',
  progress: 'progress',
} as const;

export type MotionTarget = (typeof motionTargets)[keyof typeof motionTargets];

/** The attribute that marks a part for the motion. */
export function motionTarget(name: MotionTarget): { 'data-motion': MotionTarget } {
  return { 'data-motion': name };
}

/** Every part named `name` inside `root`, in page order. */
export function findAll(root: ParentNode, name: MotionTarget): Element[] {
  return Array.from(root.querySelectorAll(`[data-motion="${name}"]`));
}

/** The first part named `name` inside `root`. */
export function find(root: ParentNode, name: MotionTarget): Element | null {
  return root.querySelector(`[data-motion="${name}"]`);
}
