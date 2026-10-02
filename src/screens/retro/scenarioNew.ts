import { SHOW_SCENARIOS } from '../../data/retro';
import type { ShowSource } from './engine/consolePlan';
import type { DamageLayer } from './engine/showTypes';
import brokenCoversCss from './layers/new/broken-covers.css?raw';
import bulletsCss from './layers/new/bullets.css?raw';
import cardPaddingCss from './layers/new/card-padding.css?raw';
import contactLabelsCss from './layers/new/contact-labels.css?raw';
import decorRoomCss from './layers/new/decor-room.css?raw';
import headingColorsCss from './layers/new/heading-colors.css?raw';
import headingRulesCss from './layers/new/heading-rules.css?raw';
import impactCellsCss from './layers/new/impact-cells.css?raw';
import impactGridCss from './layers/new/impact-grid.css?raw';
import loopFrameCss from './layers/new/loop-frame.css?raw';
import newBurstsCss from './layers/new/new-bursts.css?raw';
import pageFrameCss from './layers/new/page-frame.css?raw';
import panelColorsCss from './layers/new/panel-colors.css?raw';
import skillsGridCss from './layers/new/skills-grid.css?raw';
import typeScaleImpactCss from './layers/new/type-scale-impact.css?raw';
import { layer, DAMAGE_LAYERS as SHARED, SHOW_MODULES } from './scenario';
import { RETRO_NEW_CHUNKS } from './scenarioNewSteps';
import type { DecorationAnchors, DecorationCopy } from './scenarios';

/**
 * `/new`'s damage layers (docs/design/retro/SPEC.md → 2001 `/new` → Damage layers), in show order:
 * 17 of `/`'s files reused as they are (a shared file is a two-page contract) and 15 of its own
 * from `layers/new/`, some under the id of a `/` file with different content.
 */
export const NEW_DAMAGE_LAYERS = {
  'type-faces': SHARED['type-faces'],
  'type-family': SHARED['type-family'],
  'type-scale-headings': SHARED['type-scale-headings'],
  'type-scale-text': SHARED['type-scale-text'],
  'type-scale-impact': layer('type-scale-impact', typeScaleImpactCss, 'tokens'),
  'type-scale-cards': SHARED['type-scale-cards'],
  'type-scale-details': SHARED['type-scale-details'],
  'page-background': SHARED['page-background'],
  'base-colors': SHARED['base-colors'],
  'heading-colors': layer('heading-colors', headingColorsCss, 'rules'),
  'panel-colors': layer('panel-colors', panelColorsCss, 'tokens'),
  'page-frame': layer('page-frame', pageFrameCss, 'rules'),
  'header-layout': SHARED['header-layout'],
  'impact-grid': layer('impact-grid', impactGridCss, 'rules'),
  'experience-heads': SHARED['experience-heads'],
  'skills-grid': layer('skills-grid', skillsGridCss, 'rules'),
  'broken-photo': SHARED['broken-photo'],
  'squashed-icons': SHARED['squashed-icons'],
  'broken-covers': layer('broken-covers', brokenCoversCss, 'rules'),
  'impact-cells': layer('impact-cells', impactCellsCss, 'rules'),
  'loop-frame': layer('loop-frame', loopFrameCss, 'rules'),
  'app-cells': SHARED['app-cells'],
  'tech-cells': SHARED['tech-cells'],
  'card-colors': SHARED['card-colors'],
  'heading-rules': layer('heading-rules', headingRulesCss, 'rules'),
  bullets: layer('bullets', bulletsCss, 'rules'),
  'card-padding': layer('card-padding', cardPaddingCss, 'rules'),
  'new-bursts': layer('new-bursts', newBurstsCss, 'rules'),
  'decor-room': layer('decor-room', decorRoomCss, 'rules'),
  'hide-meta-bar': SHARED['hide-meta-bar'],
  'link-style': SHARED['link-style'],
  'contact-labels': layer('contact-labels', contactLabelsCss, 'rules'),
} as const satisfies Record<string, DamageLayer>;
export type NewDamageLayerId = keyof typeof NEW_DAMAGE_LAYERS;

/** The profile's hooks the decorations sit on (SPEC → 2001 `/new` → Decorations). */
export const PROFILE_ANCHORS: DecorationAnchors = {
  root: "[data-testid='profile']",
  header: "[data-testid='profile-header']",
};

/** The decorations' copy over the profile (SPEC → 2001 `/new` → Texts). */
export const PROFILE_COPY: DecorationCopy = {
  nav: ['navHome', 'navResume', 'navImpact', 'navApps', 'navGuestbook', 'navLinks'],
  marquee: 'marqueeNew',
  webringName: 'webringNameNew',
};

/** Everything the runner needs from `/new`'s scenario, in one place. */
export const RETRO_NEW_SHOW: ShowSource = {
  steps: RETRO_NEW_CHUNKS,
  meta: SHOW_SCENARIOS['retro-new-1'].steps,
  layers: NEW_DAMAGE_LAYERS,
  modules: SHOW_MODULES,
};
