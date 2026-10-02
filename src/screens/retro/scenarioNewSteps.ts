import { layerChunks, leave, load, on, PAGE } from './chunkBuilders';
import type { RetroStep } from './engine/showTypes';
import type { NewDamageLayerId } from './scenarioNew';

// `/new`'s fix list as data (docs/design/retro/SPEC.md → 2001 `/new` → The fix list): the same
// eight steps as `/`, each chunk one visible change on the profile's own hooks. Multi-target
// chunks list the topmost block first: the plate and the camera go there.

const { fade, morph } = layerChunks<NewDamageLayerId>();

const NAME = "[data-testid='forest-name']";
const HEADLINE = "[data-testid='forest-headline']";
const IMPACT = "[data-testid='profile-impact']";
const IMPACT_CARD = "[data-testid='forest-impact-card']";
const LOOP = "[data-testid='profile-loop']";
const LOOP_PANEL = `${LOOP} > div`;
const EXPERIENCE = "[data-testid='profile-experience']";
const JOB = "[data-testid='forest-job']";
const APP = "[data-testid='forest-app']";
const SKILLS = "[data-testid='profile-skills']";
const EDUCATION = "[data-testid='profile-education']";
const ABOUT = "[data-testid='profile-about']";
const CONTACT_LIST = "ul:has(> li > [data-testid='forest-contact'])";

/** Chunks per manifest step, in the order they are typed and applied (8 steps, 36 chunks). */
export const RETRO_NEW_CHUNKS: readonly RetroStep[] = [
  {
    id: 'fonts',
    chunks: [
      morph('type-faces', on('headings', NAME, 'h2')),
      morph('type-family', PAGE),
      fade('type-scale-headings', on('name & headline', NAME, HEADLINE, 'h2')),
      fade('type-scale-text', on('summary', "[data-testid='forest-lead']")),
      fade('type-scale-impact', on('impact & loop', IMPACT, LOOP)),
      fade('type-scale-cards', on('skills & dates', SKILLS)),
      fade('type-scale-details', on('experience & education', EXPERIENCE, EDUCATION)),
    ],
  },
  {
    id: 'colours',
    chunks: [
      morph('page-background', PAGE),
      fade('base-colors', PAGE),
      fade('heading-colors', on('name & titles', NAME, 'h2')),
      morph('panel-colors', on('impact & loop', IMPACT_CARD, LOOP_PANEL)),
    ],
  },
  {
    id: 'layout',
    chunks: [
      morph('page-frame', PAGE),
      morph('header-layout', on('header', "[data-testid='forest-hero']")),
      morph('impact-grid', on('impact', `ul:has(> ${IMPACT_CARD})`)),
      morph('experience-heads', on('experience', JOB)),
      morph('skills-grid', on('skills', SKILLS)),
    ],
  },
  {
    id: 'images',
    chunks: [
      morph('broken-photo', on('photo', "[data-testid='forest-photo']")),
      leave('oh-snap', 'note'),
      morph('squashed-icons', on('app icons', `${APP} img`)),
      morph('broken-covers', on('book covers', "[data-testid='forest-book'] img")),
    ],
  },
  {
    id: 'cards',
    chunks: [
      fade('impact-cells', on('impact cards', IMPACT_CARD)),
      fade('loop-frame', on('loop panel', LOOP_PANEL)),
      fade('app-cells', on('apps', APP)),
      fade('tech-cells', on('skills', "[data-testid='forest-skill']")),
      fade('card-colors', on('cards', IMPACT_CARD, EDUCATION, ABOUT)),
    ],
  },
  {
    id: 'spacing',
    chunks: [
      fade('heading-rules', on('section titles', 'h2')),
      morph('bullets', on('lists', "ol:has(> [data-testid='forest-loop-step'])", `${JOB} ul`)),
      fade('card-padding', on('education & about', EDUCATION, ABOUT)),
    ],
  },
  {
    id: 'chrome',
    chunks: [
      leave('top-bar', 'nav bar'),
      morph('new-bursts', on('NEW! badges', `${IMPACT} > h2`, `${LOOP} > h2`)),
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
