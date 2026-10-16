import { sectionInView } from '../../shared/agentTarget';
import type { homeStrings } from './strings';

/** The page sections the toolbar lists, in page order (agent section ids; the header is not one). */
export const HOME_NAV_SECTIONS = [
  'skills',
  'impact',
  'projects',
  'experience',
  'craft',
  'loop',
  'education',
  'about',
  'contacts',
] as const;

export type HomeNavSection = (typeof HOME_NAV_SECTIONS)[number];

/** Each section's toolbar label (`home` strings). */
export const HOME_NAV_LABELS: Record<HomeNavSection, keyof typeof homeStrings.en> = {
  skills: 'navSkills',
  impact: 'navImpact',
  projects: 'navProjects',
  experience: 'navExperience',
  craft: 'navCraft',
  loop: 'navLoop',
  education: 'navEducation',
  about: 'navAbout',
  contacts: 'navContacts',
};

const LAST = HOME_NAV_SECTIONS[HOME_NAV_SECTIONS.length - 1] ?? null;

/** Scrolled to the end: the last section is short and never reaches the reading line. */
function atPageEnd(): boolean {
  const { scrollHeight } = document.documentElement;
  return window.scrollY > 0 && window.innerHeight + window.scrollY >= scrollHeight - 1;
}

/** The section the visitor is reading, for the toolbar; `null` on the header. */
export function activeNavSection(): HomeNavSection | null {
  if (atPageEnd()) return LAST;
  const id = sectionInView(['header', ...HOME_NAV_SECTIONS]);
  return id === 'header' ? null : id;
}
