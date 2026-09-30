import { RETRO_FINALE_FALLBACK, RETRO_STEPS } from '../../data/retro';
import brokenImage from './assets/retro_icon_broken_image.svg';
import badgeNew from './assets/retro_badge_new.svg';
import tileStars from './assets/retro_tile_stars.svg';
import type { ModuleDisplay, ShowSource } from './engine/consolePlan';
import type { DamageLayer, RetroStep } from './engine/showTypes';
import brokenImagesCss from './layers/broken-images.css?raw';
import decorRoomCss from './layers/decor-room.css?raw';
import hideHeaderCss from './layers/hide-header.css?raw';
import layoutShiftCss from './layers/layout-shift.css?raw';
import newBurstsCss from './layers/new-bursts.css?raw';
import oldLinksCss from './layers/old-links.css?raw';
import oldRhythmCss from './layers/old-rhythm.css?raw';
import pageColorsCss from './layers/page-colors.css?raw';
import tableCellsCss from './layers/table-cells.css?raw';
import tokensColorsCss from './layers/tokens-colors.css?raw';
import tokensTypeCss from './layers/tokens-type.css?raw';
import typeFacesCss from './layers/type-faces.css?raw';

/** Damage layers (docs/design/retro/SPEC.md → Damage layers): the broken look, one file each. */
export const DAMAGE_LAYERS = {
  'tokens-type': { id: 'tokens-type', css: tokensTypeCss, display: 'tokens' },
  'tokens-colors': { id: 'tokens-colors', css: tokensColorsCss, display: 'tokens' },
  'type-faces': { id: 'type-faces', css: typeFacesCss, display: 'rules' },
  'page-colors': { id: 'page-colors', css: pageColorsCss, display: 'rules' },
  'layout-shift': { id: 'layout-shift', css: layoutShiftCss, display: 'rules' },
  'broken-images': { id: 'broken-images', css: brokenImagesCss, display: 'rules' },
  'table-cells': { id: 'table-cells', css: tableCellsCss, display: 'rules' },
  'old-rhythm': { id: 'old-rhythm', css: oldRhythmCss, display: 'rules' },
  'new-bursts': { id: 'new-bursts', css: newBurstsCss, display: 'rules' },
  'decor-room': { id: 'decor-room', css: decorRoomCss, display: 'rules' },
  'hide-header': { id: 'hide-header', css: hideHeaderCss, display: 'rules' },
  'old-links': { id: 'old-links', css: oldLinksCss, display: 'rules' },
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

const layer = (id: DamageLayerId) => ({ kind: 'removeLayer' as const, layer: id });
const decoration = (id: DecorationId) => ({ kind: 'removeDecoration' as const, decoration: id });
const loadModule = (id: ShowModuleId) => ({ kind: 'loadModule' as const, module: id });

/** Effects per manifest step (SPEC → Full fix list), in the order they are typed and applied. */
export const RETRO_EFFECTS: readonly RetroStep[] = [
  {
    id: 'tokens',
    effects: [
      layer('tokens-type'),
      layer('tokens-colors'),
      layer('type-faces'),
      layer('page-colors'),
    ],
  },
  { id: 'layout', effects: [layer('layout-shift')] },
  { id: 'images', effects: [layer('broken-images'), decoration('oh-snap')] },
  { id: 'cards', effects: [layer('table-cells')] },
  { id: 'spacing', effects: [layer('old-rhythm')] },
  {
    id: 'chrome',
    effects: [
      layer('new-bursts'),
      decoration('top-bar'),
      decoration('page-footer'),
      layer('decor-room'),
      layer('hide-header'),
    ],
  },
  { id: 'links', effects: [layer('old-links'), loadModule('ai-chat')] },
];

/** Everything the runner needs from the scenario, in one place. */
export const RETRO_SHOW: ShowSource = {
  steps: RETRO_EFFECTS,
  meta: RETRO_STEPS,
  layers: DAMAGE_LAYERS,
  modules: SHOW_MODULES,
  finaleFallback: RETRO_FINALE_FALLBACK,
};
