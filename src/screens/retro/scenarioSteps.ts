import { layerChunks, leave, load, on, PAGE } from './chunkBuilders';
import type { RetroStep } from './engine/showTypes';
import type { DamageLayerId } from './scenario';

// The fix list as data (docs/design/retro/SPEC.md → 2001 `/new` → The fix list, refitted to the
// v3 page: SPEC → v3 refit): per step its chunks in show order, each one visible change on the
// page's `home-*` hooks with its target (the `// → <label>` line and what the highlight marks)
// and how it lands. Multi-target chunks list the topmost block first: the plate and the camera go
// there.

const { fade, morph } = layerChunks<DamageLayerId>();

const hook = (id: string) => `[data-testid='${id}']`;
const NAME = hook('home-name');
const STAT = hook('home-stat');
const CONTACTS = `div:has(> ${hook('home-contact')})`;
const CRAFT = hook('home-craft');
const CRAFT_CARD = hook('home-craft-card');
const LOOP = hook('home-loop');
const LOOP_PANEL = `${LOOP} > div:has(> ol)`;
const IMPACT = hook('home-impact');
const IMPACT_CARD = hook('home-impact-card');
const EXPERIENCE = hook('home-experience');
const JOB = hook('home-job');
const PROJECT = hook('home-project');
const SKILLS = hook('home-skills');
const EDUCATION = hook('home-education');
const ABOUT = hook('home-about');
const FOOTER = hook('home-footer');

/** Chunks per manifest step, in the order they are typed and applied (8 steps, 36 chunks). */
export const RETRO_CHUNKS: readonly RetroStep[] = [
  {
    id: 'fonts',
    chunks: [
      morph('type-faces', on('headings', NAME, 'h2')),
      morph('type-family', PAGE),
      fade('type-scale-headings', on('name & headline', NAME, hook('home-headline'), 'h2')),
      fade('type-scale-text', on('summary & contacts', hook('home-summary'), CONTACTS)),
      fade('type-scale-cards', on('stats & cards', STAT, CRAFT)),
      fade('type-scale-impact', on('loop & impact', LOOP, IMPACT)),
      fade('type-scale-details', on('experience & footer', EXPERIENCE, FOOTER)),
    ],
  },
  {
    id: 'colours',
    chunks: [
      morph('page-background', PAGE),
      fade('base-colors', PAGE),
      fade('heading-colors', on('name & titles', NAME, 'h2')),
      morph('panel-colors', on('panels', STAT, LOOP_PANEL, FOOTER)),
    ],
  },
  {
    id: 'layout',
    chunks: [
      morph('page-frame', PAGE),
      morph('header-layout', on('header', hook('home-header'))),
      morph('impact-grid', on('craft & impact', `div:has(> ${CRAFT_CARD})`, IMPACT)),
      morph('experience-heads', on('experience', JOB)),
      morph('skills-grid', on('skills', SKILLS)),
    ],
  },
  {
    id: 'images',
    chunks: [
      morph('broken-photo', on('photo', hook('home-photo'))),
      leave('oh-snap', 'note'),
      morph('squashed-icons', on('app icons', `${PROJECT} img`)),
      morph('broken-covers', on('book covers', hook('home-book'))),
    ],
  },
  {
    id: 'cards',
    chunks: [
      fade('impact-cells', on('cells', STAT, CRAFT_CARD, IMPACT_CARD)),
      fade('loop-frame', on('loop panel', LOOP_PANEL)),
      fade('app-cells', on('projects', PROJECT)),
      fade('tech-cells', on('skills', hook('home-skill'))),
      fade('card-colors', on('cards', STAT, CRAFT_CARD, IMPACT_CARD, ABOUT)),
    ],
  },
  {
    id: 'spacing',
    chunks: [
      fade('heading-rules', on('section titles', 'h2')),
      morph('bullets', on('lists', `ol:has(> ${hook('home-loop-step')})`, `${JOB} ul`)),
      fade('card-padding', on('cards & footer', EDUCATION, ABOUT, FOOTER)),
    ],
  },
  {
    id: 'chrome',
    chunks: [
      leave('top-bar', 'nav bar'),
      morph('new-bursts', on('NEW! badges', `${LOOP} h2`, `${IMPACT} h2`)),
      leave('page-footer', 'footer'),
      fade('decor-room', PAGE),
      morph('hide-meta-bar', on('meta bar', hook('home-meta-bar'))),
    ],
  },
  {
    id: 'links',
    chunks: [
      morph('link-style', on('links', CONTACTS, FOOTER)),
      morph('contact-labels', on('contacts', CONTACTS)),
      load('ai-chat'),
    ],
  },
];
