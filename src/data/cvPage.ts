import type { Book, ImageRef } from './models';
import type {
  AgentLoop,
  Education,
  FooterCta,
  HeadlinePart,
  ImpactCard,
  SkillGroup,
} from './profile';

/**
 * The one CV page (v3) as the UI consumes it: English only, in the design's order
 * (`docs/design/v3/`, ADR-0006 → Decision 1). Every list item carries a stable slug `id`: React key
 * and AI page-agent target (`src/data/chat/agentTools.ts` → `cvPageTargetIds`). Only emphasis
 * (`accent`) is data; card tones and section headings belong to the screen.
 */
export interface CvPage {
  meta: CvPageMeta;
  name: string;
  /** Under the name, e.g. `Android since 2012 · Agentic engineering`. */
  tagline: string;
  photo: ImageRef;
  /** The h1; parts marked `accent` are set in the text gradient. */
  headline: HeadlinePart[];
  /** One entry per line. */
  summary: string[];
  stats: Stat[];
  /** Header buttons in order; ids are `CV_CONTACT_CHANNELS`. */
  contacts: CvContact[];
  craft: CraftCard[];
  loop: AgentLoop;
  impact: ImpactCard[];
  jobs: CvJob[];
  skills: SkillGroup[];
  education: Education;
  about: CvAbout;
  footer: FooterCta;
}

/** Facts in the meta bar. */
export interface CvPageMeta {
  location: string;
  workMode: string;
  /** Availability, shown with the status dot (e.g. `Open to roles`). */
  status: string;
}

/** A header stat tile. */
export interface Stat {
  id: string;
  /** The big figure, e.g. `12+`, `AI`. */
  value: string;
  label: string;
  /** The emphasised tile (set on the gradient). */
  accent?: boolean;
}

export interface CvContact {
  id: string;
  /** The channel name, or the address for email (the footer shows it). */
  label: string;
  /** `mailto:` or an URL. */
  href: string;
}

/** A "Code craft × agentic process" card. */
export interface CraftCard {
  id: string;
  /** The small mono label, e.g. `2012 → before AI`. */
  label: string;
  title: string;
  text: string;
}

export interface CvJob {
  id: string;
  company: string;
  role: string;
  /** As displayed, e.g. `2021 – 2026`. */
  period: string;
  logo: ImageRef;
  /** The logo is shown without its tile (Samsung). */
  logoPlain?: boolean;
  /** Kind of what was built, e.g. `product`, `tool`; shown with `about`. */
  tag?: string;
  /** One line on the product. */
  about?: string;
  /** Store line as displayed, e.g. `1M+ · 4.5★`. */
  meta?: string;
  points: string[];
  /** Client projects (Transcenda). */
  projects?: CvProject[];
}

export interface CvProject {
  id: string;
  name: string;
  /** Absent: the screen draws an initials tile from `name` (every project has one today). */
  icon?: ImageRef;
  /** E.g. `Smart Home`. */
  domain: string;
  /** As displayed, e.g. `1M+ · 5.0★ · 91.8K reviews`. */
  meta: string;
  about: string;
  points: string[];
}

export interface CvAbout {
  books: Book[];
  /** One line each, e.g. `Off-screen:` + the hobbies. */
  lines: CvAboutLine[];
}

export interface CvAboutLine {
  label: string;
  text: string;
}
