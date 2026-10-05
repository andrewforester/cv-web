import type { ShowScenarioId } from '../data/retro';

/**
 * The Show case scenario the page runs (docs/retro/ARCHITECTURE.md §11); `undefined`: no show, so
 * no Show case button and `?retro=1` opens today's page. Off until `retro-4` is ported to the v3
 * page's hooks (CV-107 Build split → T6).
 */
export const SHOW_SCENARIO: ShowScenarioId | undefined = undefined;
