import type { Book, ImageRef } from './models';

/**
 * The `/new` page as the UI consumes it, already in one locale. Mirrors
 * `docs/design/forest/SPEC.md` → Structure. List items carry a stable, locale-independent slug
 * `id` (the same in every locale's JSON), like `Cv`, so the page agent can address them.
 */
export interface Profile {
  meta: ProfileMeta;
  name: string;
  /** The h1; parts marked `accent` are set in the text gradient. */
  headline: HeadlinePart[];
  subtitle: string;
  photo: ImageRef;
  /** The lead paragraph. */
  summary: string;
  contacts: ProfileContact[];
  impact: ImpactCard[];
  loop: AgentLoop;
  jobs: Job[];
  earlier: EarlierJob[];
  apps: ProfileApp[];
  skills: SkillGroup[];
  education: Education;
  about: About;
  footer: FooterCta;
}

/** Facts in the meta bar. */
export interface ProfileMeta {
  location: string;
  workMode: string;
  /** Availability, shown with the status dot (e.g. `Open to roles`). */
  status: string;
}

export interface HeadlinePart {
  text: string;
  accent?: boolean;
}

export interface ProfileContact {
  id: string;
  label: string;
  /** `mailto:`, `tel:`, an URL, or `#ask` (opens the site's AI chat). */
  href: string;
}

export interface ImpactCard {
  id: string;
  /** The big figure, e.g. `1 day`, `1M+`. */
  value: string;
  text: string;
}

/** The "How I build with agents" panel; steps are numbered by their order. */
export interface AgentLoop {
  lead: string;
  steps: LoopStep[];
  /** Without the leading `↺`, which is decoration. */
  footnote: string;
}

export interface LoopStep {
  id: string;
  text: string;
}

export interface Job {
  id: string;
  company: string;
  role: string;
  /** As displayed, e.g. `Feb 2021 – Feb 2026`. */
  period: string;
  points: string[];
}

/** A one-line entry of the "Earlier" row. */
export interface EarlierJob {
  id: string;
  company: string;
  role: string;
  period: string;
}

export interface ProfileApp {
  id: string;
  name: string;
  icon: ImageRef;
  /** As displayed, e.g. `5.0★ · 91.8K · 1M+`. */
  meta: string;
}

export interface SkillGroup {
  id: string;
  title: string;
  /** As displayed, comma-separated. */
  items: string;
}

export interface Education {
  title: string;
  place: string;
  /** As displayed, e.g. `2007–2012`. */
  period: string;
  text: string;
}

export interface About {
  books: Book[];
  /** One line each. */
  text: string[];
}

export interface FooterCta {
  label: string;
  /** Usually `mailto:`. */
  href: string;
}
