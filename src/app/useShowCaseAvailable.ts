import type { ShowScenarioId } from '../data/retro';
import { useMediaQuery } from '../shared/useMediaQuery';

/** Where the show can run: a desktop viewport (docs/retro/ARCHITECTURE.md §9). */
const SHOW_CASE_QUERY = '(min-width: 1024px)';

/** The Show case button is offered: the page has a scenario and the viewport is desktop. */
export function useShowCaseAvailable(scenario: ShowScenarioId | undefined): boolean {
  const desktop = useMediaQuery(SHOW_CASE_QUERY);
  return scenario !== undefined && desktop;
}
