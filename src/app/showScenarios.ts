import { RETRO_SCENARIO_ID, type ShowScenarioId } from '../data/retro';

/**
 * The Show case scenario the page runs (docs/retro/ARCHITECTURE.md §11); `undefined` would turn
 * the show off (no Show case button, and `?retro=1` opens today's page).
 */
export const SHOW_SCENARIO: ShowScenarioId | undefined = RETRO_SCENARIO_ID;
