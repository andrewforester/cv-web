import { layerChunks, leave, load, on, PAGE } from './chunkBuilders';
import type { RetroStep } from './engine/showTypes';
import type { DamageLayerId } from './scenario';

// The fix list as data (docs/design/retro/SPEC.md → The fix list): per step its chunks in show
// order, each one visible change with its target (the `// → <label>` line and what the highlight
// marks) and how it lands.

const { fade, morph } = layerChunks<DamageLayerId>();

const NAME = "[data-testid='forest-name']";
const HEADLINE = "[data-testid='forest-headline']";
const TECHNOLOGIES = "[data-agent-id='section:technologies']";
const TECHNOLOGY_CARD = "[data-testid='forest-skill']";
const EXPERIENCE = "[data-agent-id='section:latest-experience']";
const JOB = "[data-testid='forest-job']";
const APP_CARD = "[data-testid='forest-app']";
const EDUCATION = "[data-agent-id='section:education']";
const ABOUT = "[data-agent-id='section:about']";
const SUMMARY = "[data-testid='forest-lead']";

const NAME_AND_TITLES = on('name & titles', NAME, 'h2');
const CONTACT_LIST = "ul:has(> li > [data-testid='forest-contact'])";

/** Chunks per manifest step, in the order they are typed and applied (8 steps, 36 chunks). */
export const RETRO_CHUNKS: readonly RetroStep[] = [
  {
    id: 'fonts',
    chunks: [
      morph('type-faces', on('headings', NAME, 'h2')),
      morph('type-family', PAGE),
      fade('type-scale-headings', on('name & headline', NAME, HEADLINE, 'h2')),
      fade('type-scale-text', on('body text', SUMMARY)),
      fade('type-scale-cards', on('skills & dates', TECHNOLOGIES)),
      fade('type-scale-details', on('experience & education', EXPERIENCE, EDUCATION)),
    ],
  },
  {
    id: 'colours',
    chunks: [
      morph('page-background', PAGE),
      fade('base-colors', PAGE),
      fade('heading-colors', NAME_AND_TITLES),
      fade('tech-fills', on('skills', TECHNOLOGY_CARD)),
    ],
  },
  {
    id: 'layout',
    chunks: [
      morph('page-frame', PAGE),
      morph('header-layout', on('header', "[data-testid='forest-hero']")),
      morph('tech-grid', on('skills', TECHNOLOGIES)),
      morph('experience-heads', on('experience', JOB)),
      morph('app-stack', on('apps', "[data-agent-id='section:apps']")),
    ],
  },
  {
    id: 'images',
    chunks: [
      morph('broken-photo', on('photo', "[data-testid='forest-photo']")),
      leave('oh-snap', 'note'),
      morph('squashed-icons', on('app icons', `${APP_CARD} img`)),
      morph('broken-icon', on('Savant icon', "[data-agent-id='app:savant'] img")),
      morph('broken-cover', on('book cover', "[data-agent-id='book:siddhartha'] img")),
    ],
  },
  {
    id: 'cards',
    chunks: [
      fade('tech-cells', on('skills', TECHNOLOGY_CARD)),
      fade('app-cells', on('apps', APP_CARD)),
      fade('card-colors', on('cards', APP_CARD, EDUCATION, ABOUT)),
      fade('book-frames', on('books', "[data-testid='forest-book'] img")),
    ],
  },
  {
    id: 'spacing',
    chunks: [
      fade('heading-rules', on('section titles', 'h2')),
      morph('bullets', on('bullets', SUMMARY, EXPERIENCE)),
      fade('experience-rhythm', on('experience', JOB)),
      fade('card-padding', on('education & about', EDUCATION, ABOUT)),
    ],
  },
  {
    id: 'chrome',
    chunks: [
      leave('top-bar', 'nav bar'),
      morph(
        'new-bursts',
        on('NEW! badges', `${EXPERIENCE} h3`, "[data-agent-id='technology:ai-tools'] h3"),
      ),
      leave('page-footer', 'footer'),
      fade('decor-room', PAGE),
      morph('hide-meta-bar', on('meta bar', "[data-testid='forest-meta-bar']")),
    ],
  },
  {
    id: 'links',
    chunks: [
      morph('link-style', on('links', CONTACT_LIST, 'footer a')),
      morph('contact-labels', on('contacts', CONTACT_LIST)),
      load('ai-chat'),
    ],
  },
];
