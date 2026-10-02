import type { ShowScenarioId } from '../data/retro';
import type { Page } from './routes';

/**
 * Pages with a Show case and the scenario each one runs (docs/retro/ARCHITECTURE.md §10): adding a
 * page's show is registering its scenario here, together with its source in the retro screen.
 */
export const SHOW_SCENARIO_BY_PAGE: Partial<Record<Page, ShowScenarioId>> = {
  cv: 'retro-3',
  profile: 'retro-new-1',
};

/** The page's scenario; `undefined` when the page has no show. */
export const showScenarioFor = (page: Page): ShowScenarioId | undefined =>
  SHOW_SCENARIO_BY_PAGE[page];
