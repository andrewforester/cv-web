/** The CV as the UI consumes it, already in one locale. Mirrors `docs/design/cv/SPEC.md`. */
export interface Cv {
  header: CvHeader;
  /** One line each. */
  summary: RichText[];
  technologies: TechnologyCard[];
  latestExperience: ExperienceEntry[];
  apps: AppCard[];
  /** One line each. */
  education: string[];
  books: Book[];
  interests: string;
  previousExperience: ExperienceEntry[];
}

/** A run of text; `emphasis` marks a fragment set in Medium or Bold Italic. */
export interface TextSpan {
  text: string;
  emphasis?: 'medium' | 'boldItalic';
}

/** A line of text with emphasised fragments (no HTML). */
export type RichText = TextSpan[];

/**
 * An image reference: an asset id bundled with the site (e.g. `photo`, `logo_transcenda`) or an
 * absolute URL (a backend may return those).
 */
export type ImageRef = string;

export interface CvHeader {
  name: string;
  headline: string;
  tagline: string;
  photo: ImageRef;
  contacts: Contacts;
}

export interface Contacts {
  email: string;
  /** As displayed, e.g. `+38 093 897-71-10`; the `tel:` link is derived from it. */
  phone: string;
  whatsappUrl: string;
  telegramUrl: string;
}

export type TechnologyCardVariant = 'default' | 'highlighted' | 'ai';

export interface TechnologyCard {
  title: string;
  items: string[];
  variant: TechnologyCardVariant;
  /** Desktop masonry column, 1–3; cards keep their array order inside a column. */
  column: 1 | 2 | 3;
}

export interface ExperienceEntry {
  company: string;
  remote: boolean;
  role: string;
  /** As displayed, e.g. `Feb 2021 - Feb 2026`. */
  period: string;
  logo: ImageRef;
  bullets: RichText[];
}

export interface AppCard {
  name: string;
  publisher: string;
  icon: ImageRef;
  /** E.g. `5.0`; absent when the app shows no rating. */
  rating?: string;
  /** E.g. `91.8K`; shown with the rating. */
  reviews?: string;
  /** E.g. `1M+`. */
  downloads: string;
}

export interface Book {
  title: string;
  author: string;
  cover: ImageRef;
}
