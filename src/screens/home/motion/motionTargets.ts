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
  /** A titled section (`HomeSection`) and its heading. */
  section: 'section',
  heading: 'heading',
  /** The craft and impact card grids, their cards (tilted on hover) and the skills grid's groups. */
  craft: 'craft',
  impact: 'impact',
  card: 'card',
  skills: 'skills',
  skill: 'skill',
  /** The loop's dark panel, its lead, steps, last line and the cursor spotlight. */
  panel: 'panel',
  panelLead: 'panel-lead',
  step: 'step',
  footnote: 'footnote',
  spotlight: 'spotlight',
  /** A job, its logo, its own points; a project on the tree: stem, branch, body. */
  job: 'job',
  logo: 'logo',
  points: 'points',
  project: 'project',
  stem: 'stem',
  branch: 'branch',
  projectBody: 'project-body',
  /** The education and about-me cards row, each card, the book covers. */
  columns: 'columns',
  column: 'column',
  badge: 'badge',
  /** The closing call to action and its arrow. */
  cta: 'cta',
  arrow: 'arrow',
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
