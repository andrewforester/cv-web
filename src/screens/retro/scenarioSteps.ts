import type { ChunkTarget, LayerMotion, RetroChunk, RetroStep } from './engine/showTypes';
import type { DamageLayerId, DecorationId, ShowModuleId } from './scenario';

// The fix list as data (docs/design/retro/SPEC.md → The fix list): per step its chunks in show
// order, each one visible change with its target (the `// → <label>` line and what the highlight
// marks) and how it lands.

const PAGE: ChunkTarget = { label: 'page', selectors: 'page' };
const on = (label: string, ...selectors: string[]): ChunkTarget => ({ label, selectors });

const layer =
  (motion: LayerMotion) =>
  (id: DamageLayerId, target: ChunkTarget): RetroChunk => ({
    effect: { kind: 'removeLayer', layer: id },
    target,
    motion,
  });
const fade = layer('fade');
const morph = layer('morph');
const leave = (id: DecorationId, label: string): RetroChunk => ({
  effect: { kind: 'removeDecoration', decoration: id },
  target: on(label, `#${id}`),
});
const load = (id: ShowModuleId): RetroChunk => ({
  effect: { kind: 'loadModule', module: id },
  target: null,
});

const NAME = "[data-testid='cv-name']";
const HEADER = "[data-agent-id='section:header']";
const TECHNOLOGIES = "[data-agent-id='section:technologies']";
const TECHNOLOGY_CARD = "[data-testid='cv-technology-card']";
const EXPERIENCE = "[data-agent-id='section:latest-experience']";
const APP_CARD = "[data-testid='cv-app-card']";
const ABOUT = "[data-agent-id='section:about']";
const SUMMARY = "[data-testid='cv-summary']";

const NAME_AND_TITLES = on('name & titles', NAME, 'h2');
const CONTACTS = on('contacts', `${HEADER} address`);

/** Chunks per manifest step, in the order they are typed and applied (8 steps, 36 chunks). */
export const RETRO_CHUNKS: readonly RetroStep[] = [
  {
    id: 'fonts',
    chunks: [
      morph('type-faces', on('headings', NAME, 'h2')),
      morph('type-family', PAGE),
      fade('type-scale-headings', NAME_AND_TITLES),
      fade('type-scale-text', on('body text', SUMMARY)),
      fade('type-scale-cards', on('cards & dates', TECHNOLOGIES)),
      fade(
        'type-scale-details',
        on('education & books', "[data-agent-id='section:education']", ABOUT),
      ),
    ],
  },
  {
    id: 'colours',
    chunks: [
      morph('page-background', PAGE),
      fade('base-colors', PAGE),
      fade('heading-colors', NAME_AND_TITLES),
      fade('tech-fills', on('technologies', TECHNOLOGY_CARD)),
    ],
  },
  {
    id: 'layout',
    chunks: [
      morph('page-frame', PAGE),
      morph('header-layout', on('header', HEADER)),
      morph('tech-grid', on('technologies', TECHNOLOGIES)),
      morph(
        'experience-heads',
        on('experience', `${EXPERIENCE} [data-testid='cv-experience-entry']`),
      ),
      morph('app-stack', on('apps', "[data-agent-id='section:apps']")),
    ],
  },
  {
    id: 'images',
    chunks: [
      morph('broken-photo', on('photo', `${HEADER} > img`)),
      leave('oh-snap', 'note'),
      morph('squashed-logos', on('logos', "[data-testid='cv-experience-entry'] img")),
      morph('broken-icon', on('Savant icon', "[data-agent-id='app:savant'] img")),
      morph('broken-cover', on('book cover', "[data-agent-id='book:siddhartha'] img")),
    ],
  },
  {
    id: 'cards',
    chunks: [
      morph('tech-cells', on('technologies', TECHNOLOGY_CARD)),
      fade('app-cells', on('apps', APP_CARD)),
      fade('card-colors', on('card borders', TECHNOLOGY_CARD, APP_CARD)),
      fade('book-frames', on('books', "[data-testid='cv-book'] img")),
    ],
  },
  {
    id: 'spacing',
    chunks: [
      fade('heading-rules', on('section titles', 'h2')),
      morph('bullets', on('bullets', SUMMARY, EXPERIENCE)),
      fade('experience-rhythm', on('experience', EXPERIENCE)),
      fade('about-spacing', on('about me', ABOUT)),
    ],
  },
  {
    id: 'chrome',
    chunks: [
      leave('top-bar', 'nav bar'),
      morph(
        'new-bursts',
        on('NEW! badges', "[data-agent-id='technology:ai-tools']", `${EXPERIENCE} h2`),
      ),
      leave('page-footer', 'footer'),
      fade('decor-room', PAGE),
      morph('hide-header', on('language switcher', "[data-testid='app-header']")),
    ],
  },
  {
    id: 'links',
    chunks: [morph('link-style', CONTACTS), morph('contact-labels', CONTACTS), load('ai-chat')],
  },
];
