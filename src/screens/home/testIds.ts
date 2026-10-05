/**
 * Test ids of the one CV page (ADR-0006 → Decision 2). They are also the hooks the Show case's
 * layers select (docs/retro/ARCHITECTURE.md §11), so renaming one is a contract change.
 */
export const homeTestIds = {
  root: 'home',
  status: 'home-status',
  // Page parts
  metaBar: 'home-meta-bar',
  header: 'home-header',
  photo: 'home-photo',
  name: 'home-name',
  headline: 'home-headline',
  summary: 'home-summary',
  stat: 'home-stat',
  contact: 'home-contact',
  // Sections
  craft: 'home-craft',
  loop: 'home-loop',
  impact: 'home-impact',
  experience: 'home-experience',
  skills: 'home-skills',
  education: 'home-education',
  about: 'home-about',
  footer: 'home-footer',
  // Items
  craftCard: 'home-craft-card',
  loopStep: 'home-loop-step',
  impactCard: 'home-impact-card',
  job: 'home-job',
  project: 'home-project',
  skill: 'home-skill',
  book: 'home-book',
  footerLink: 'home-footer-link',
} as const;
