import { RETRO_STEPS } from '../../data/retro';
import brokenImage from './assets/retro_icon_broken_image.svg';
import badgeNew from './assets/retro_badge_new.svg';
import tileStars from './assets/retro_tile_stars.svg';
import type { ModuleDisplay, ShowSource } from './engine/consolePlan';
import type { DamageLayer } from './engine/showTypes';
import aboutSpacingCss from './layers/about-spacing.css?raw';
import appCellsCss from './layers/app-cells.css?raw';
import appStackCss from './layers/app-stack.css?raw';
import baseColorsCss from './layers/base-colors.css?raw';
import bookFramesCss from './layers/book-frames.css?raw';
import brokenCoverCss from './layers/broken-cover.css?raw';
import brokenIconCss from './layers/broken-icon.css?raw';
import brokenPhotoCss from './layers/broken-photo.css?raw';
import bulletsCss from './layers/bullets.css?raw';
import cardColorsCss from './layers/card-colors.css?raw';
import contactLabelsCss from './layers/contact-labels.css?raw';
import decorRoomCss from './layers/decor-room.css?raw';
import experienceHeadsCss from './layers/experience-heads.css?raw';
import experienceRhythmCss from './layers/experience-rhythm.css?raw';
import headerLayoutCss from './layers/header-layout.css?raw';
import headingColorsCss from './layers/heading-colors.css?raw';
import headingRulesCss from './layers/heading-rules.css?raw';
import hideHeaderCss from './layers/hide-header.css?raw';
import linkStyleCss from './layers/link-style.css?raw';
import newBurstsCss from './layers/new-bursts.css?raw';
import pageBackgroundCss from './layers/page-background.css?raw';
import pageFrameCss from './layers/page-frame.css?raw';
import squashedLogosCss from './layers/squashed-logos.css?raw';
import techCellsCss from './layers/tech-cells.css?raw';
import techFillsCss from './layers/tech-fills.css?raw';
import techGridCss from './layers/tech-grid.css?raw';
import typeFacesCss from './layers/type-faces.css?raw';
import typeFamilyCss from './layers/type-family.css?raw';
import typeScaleCardsCss from './layers/type-scale-cards.css?raw';
import typeScaleDetailsCss from './layers/type-scale-details.css?raw';
import typeScaleHeadingsCss from './layers/type-scale-headings.css?raw';
import typeScaleTextCss from './layers/type-scale-text.css?raw';
import { RETRO_CHUNKS } from './scenarioSteps';

const layer = (id: string, css: string, display: DamageLayer['display']): DamageLayer => ({
  id,
  css,
  display,
});

/**
 * Damage layers (docs/design/retro/SPEC.md → Damage layers and The fix list): the broken look, one
 * concern per file, in show order. `tokens`: `:root` overrides typed as a diff; `rules`: verbatim.
 */
export const DAMAGE_LAYERS = {
  'type-faces': layer('type-faces', typeFacesCss, 'rules'),
  'type-family': layer('type-family', typeFamilyCss, 'tokens'),
  'type-scale-headings': layer('type-scale-headings', typeScaleHeadingsCss, 'tokens'),
  'type-scale-text': layer('type-scale-text', typeScaleTextCss, 'tokens'),
  'type-scale-cards': layer('type-scale-cards', typeScaleCardsCss, 'tokens'),
  'type-scale-details': layer('type-scale-details', typeScaleDetailsCss, 'tokens'),
  'page-background': layer('page-background', pageBackgroundCss, 'rules'),
  'base-colors': layer('base-colors', baseColorsCss, 'tokens'),
  'heading-colors': layer('heading-colors', headingColorsCss, 'rules'),
  'tech-fills': layer('tech-fills', techFillsCss, 'rules'),
  'page-frame': layer('page-frame', pageFrameCss, 'rules'),
  'header-layout': layer('header-layout', headerLayoutCss, 'rules'),
  'tech-grid': layer('tech-grid', techGridCss, 'rules'),
  'experience-heads': layer('experience-heads', experienceHeadsCss, 'rules'),
  'app-stack': layer('app-stack', appStackCss, 'rules'),
  'broken-photo': layer('broken-photo', brokenPhotoCss, 'rules'),
  'squashed-logos': layer('squashed-logos', squashedLogosCss, 'rules'),
  'broken-icon': layer('broken-icon', brokenIconCss, 'rules'),
  'broken-cover': layer('broken-cover', brokenCoverCss, 'rules'),
  'tech-cells': layer('tech-cells', techCellsCss, 'rules'),
  'app-cells': layer('app-cells', appCellsCss, 'rules'),
  'card-colors': layer('card-colors', cardColorsCss, 'tokens'),
  'book-frames': layer('book-frames', bookFramesCss, 'rules'),
  'heading-rules': layer('heading-rules', headingRulesCss, 'rules'),
  bullets: layer('bullets', bulletsCss, 'rules'),
  'experience-rhythm': layer('experience-rhythm', experienceRhythmCss, 'rules'),
  'about-spacing': layer('about-spacing', aboutSpacingCss, 'rules'),
  'new-bursts': layer('new-bursts', newBurstsCss, 'rules'),
  'decor-room': layer('decor-room', decorRoomCss, 'rules'),
  'hide-header': layer('hide-header', hideHeaderCss, 'rules'),
  'link-style': layer('link-style', linkStyleCss, 'rules'),
  'contact-labels': layer('contact-labels', contactLabelsCss, 'rules'),
} as const satisfies Record<string, DamageLayer>;
export type DamageLayerId = keyof typeof DAMAGE_LAYERS;

/** Show-owned DOM over the page (SPEC → Decorations); the id is also the element's DOM id. */
export const DECORATION_IDS = ['top-bar', 'page-footer', 'oh-snap'] as const;
export type DecorationId = (typeof DECORATION_IDS)[number];

/** Chunks a step loads for real; the shell passes a loader per id. */
export const SHOW_MODULES = {
  'ai-chat': { exportName: 'ChatRoute', path: './chat', label: 'chat button' },
} as const satisfies Record<string, ModuleDisplay>;
export type ShowModuleId = keyof typeof SHOW_MODULES;
export type ShowModuleLoaders = Record<ShowModuleId, () => Promise<unknown>>;

/** Asset URLs the layers read (`var(--retro-broken-image)` …), set by the layer host. */
export const HOST_VARIABLES = {
  '--retro-broken-image': `url("${brokenImage}")`,
  '--retro-tile-stars': `url("${tileStars}")`,
  '--retro-badge-new': `url("${badgeNew}")`,
};

/** Everything the runner needs from the scenario, in one place. */
export const RETRO_SHOW: ShowSource = {
  steps: RETRO_CHUNKS,
  meta: RETRO_STEPS,
  layers: DAMAGE_LAYERS,
  modules: SHOW_MODULES,
};
