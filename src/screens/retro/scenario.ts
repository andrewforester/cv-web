import { RETRO_STEPS } from '../../data/retro';
import brokenImage from './assets/retro_icon_broken_image.svg';
import badgeNew from './assets/retro_badge_new.svg';
import tileStars from './assets/retro_tile_stars.svg';
import type { ModuleDisplay, ShowSource } from './engine/consolePlan';
import type { DamageLayer } from './engine/showTypes';
import appCellsCss from './layers/app-cells.css?raw';
import baseColorsCss from './layers/base-colors.css?raw';
import brokenCoversCss from './layers/broken-covers.css?raw';
import brokenPhotoCss from './layers/broken-photo.css?raw';
import bulletsCss from './layers/bullets.css?raw';
import cardColorsCss from './layers/card-colors.css?raw';
import cardPaddingCss from './layers/card-padding.css?raw';
import contactLabelsCss from './layers/contact-labels.css?raw';
import decorRoomCss from './layers/decor-room.css?raw';
import experienceHeadsCss from './layers/experience-heads.css?raw';
import headerLayoutCss from './layers/header-layout.css?raw';
import headingColorsCss from './layers/heading-colors.css?raw';
import headingRulesCss from './layers/heading-rules.css?raw';
import hideMetaBarCss from './layers/hide-meta-bar.css?raw';
import impactCellsCss from './layers/impact-cells.css?raw';
import impactGridCss from './layers/impact-grid.css?raw';
import linkStyleCss from './layers/link-style.css?raw';
import loopFrameCss from './layers/loop-frame.css?raw';
import newBurstsCss from './layers/new-bursts.css?raw';
import pageBackgroundCss from './layers/page-background.css?raw';
import pageFrameCss from './layers/page-frame.css?raw';
import panelColorsCss from './layers/panel-colors.css?raw';
import skillsGridCss from './layers/skills-grid.css?raw';
import squashedIconsCss from './layers/squashed-icons.css?raw';
import techCellsCss from './layers/tech-cells.css?raw';
import typeFacesCss from './layers/type-faces.css?raw';
import typeFamilyCss from './layers/type-family.css?raw';
import typeScaleCardsCss from './layers/type-scale-cards.css?raw';
import typeScaleDetailsCss from './layers/type-scale-details.css?raw';
import typeScaleHeadingsCss from './layers/type-scale-headings.css?raw';
import typeScaleImpactCss from './layers/type-scale-impact.css?raw';
import typeScaleTextCss from './layers/type-scale-text.css?raw';
import { RETRO_CHUNKS } from './scenarioSteps';
import type { RetroStrings } from './strings';

// The show's one source (docs/retro/ARCHITECTURE.md §11, `retro-4`): what its steps do to the v3
// page. The manifest (ids, intents, fallbacks) is `src/data/retro`; the fix list is
// `scenarioSteps.ts`.

const layer = (id: string, css: string, display: DamageLayer['display']): DamageLayer => ({
  id,
  css,
  display,
});

/**
 * Damage layers (docs/design/retro/SPEC.md → 2001 `/new` → Damage layers and → v3 refit): the
 * broken look, one concern per file, in show order. `tokens`: `:root` overrides typed as a diff;
 * `rules`: verbatim.
 */
export const DAMAGE_LAYERS = {
  'type-faces': layer('type-faces', typeFacesCss, 'rules'),
  'type-family': layer('type-family', typeFamilyCss, 'tokens'),
  'type-scale-headings': layer('type-scale-headings', typeScaleHeadingsCss, 'tokens'),
  'type-scale-text': layer('type-scale-text', typeScaleTextCss, 'tokens'),
  'type-scale-cards': layer('type-scale-cards', typeScaleCardsCss, 'tokens'),
  'type-scale-impact': layer('type-scale-impact', typeScaleImpactCss, 'tokens'),
  'type-scale-details': layer('type-scale-details', typeScaleDetailsCss, 'tokens'),
  'page-background': layer('page-background', pageBackgroundCss, 'rules'),
  'base-colors': layer('base-colors', baseColorsCss, 'tokens'),
  'heading-colors': layer('heading-colors', headingColorsCss, 'rules'),
  'panel-colors': layer('panel-colors', panelColorsCss, 'tokens'),
  'page-frame': layer('page-frame', pageFrameCss, 'rules'),
  'header-layout': layer('header-layout', headerLayoutCss, 'rules'),
  'impact-grid': layer('impact-grid', impactGridCss, 'rules'),
  'experience-heads': layer('experience-heads', experienceHeadsCss, 'rules'),
  'skills-grid': layer('skills-grid', skillsGridCss, 'rules'),
  'broken-photo': layer('broken-photo', brokenPhotoCss, 'rules'),
  'squashed-icons': layer('squashed-icons', squashedIconsCss, 'rules'),
  'broken-covers': layer('broken-covers', brokenCoversCss, 'rules'),
  'impact-cells': layer('impact-cells', impactCellsCss, 'rules'),
  'loop-frame': layer('loop-frame', loopFrameCss, 'rules'),
  'app-cells': layer('app-cells', appCellsCss, 'rules'),
  'tech-cells': layer('tech-cells', techCellsCss, 'rules'),
  'card-colors': layer('card-colors', cardColorsCss, 'tokens'),
  'heading-rules': layer('heading-rules', headingRulesCss, 'rules'),
  bullets: layer('bullets', bulletsCss, 'rules'),
  'card-padding': layer('card-padding', cardPaddingCss, 'rules'),
  'new-bursts': layer('new-bursts', newBurstsCss, 'rules'),
  'decor-room': layer('decor-room', decorRoomCss, 'rules'),
  'hide-meta-bar': layer('hide-meta-bar', hideMetaBarCss, 'rules'),
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

/** Stable hooks of the page the decorations anchor on (unprefixed selectors). */
export interface DecorationAnchors {
  /** The page's root: the top bar sits on its top, the footer on its bottom. */
  root: string;
  /** The page's header: the note sits under it while the layout is broken. */
  header: string;
  /** The photo: the note sits on its top-right corner once the layout is fixed. */
  photo: string;
}

/** Which `retroStrings` the decorations show. */
export interface DecorationCopy {
  nav: readonly (keyof RetroStrings)[];
  marquee: keyof RetroStrings;
  webringName: keyof RetroStrings;
}

/** The show's source: the runner's steps, layers and modules, the decorations' anchors and copy. */
export interface RetroShowSource {
  show: ShowSource;
  anchors: DecorationAnchors;
  copy: DecorationCopy;
}

/** Everything the runner needs from the scenario. */
export const RETRO_SHOW: ShowSource = {
  steps: RETRO_CHUNKS,
  meta: RETRO_STEPS,
  layers: DAMAGE_LAYERS,
  modules: SHOW_MODULES,
};

/** Everything the runner and the screen need from the scenario, in one place. */
export const RETRO_SOURCE: RetroShowSource = {
  show: RETRO_SHOW,
  anchors: {
    root: "[data-testid='home']",
    header: "[data-testid='home-header']",
    photo: "[data-testid='home-photo']",
  },
  copy: {
    nav: ['navHome', 'navResume', 'navImpact', 'navApps', 'navGuestbook', 'navLinks'],
    marquee: 'marquee',
    webringName: 'webringName',
  },
};
