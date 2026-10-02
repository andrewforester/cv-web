import type { ShowScenarioId } from '../data/retro';
import { useLocale } from '../i18n';
import { useMediaQuery } from '../shared/useMediaQuery';

/** Where the show can run besides English: a desktop viewport (docs/retro/ARCHITECTURE.md §9). */
const SHOW_CASE_QUERY = '(min-width: 1024px)';

/** The Show case button is offered: the page has a scenario, English, a desktop viewport. */
export function useShowCaseAvailable(scenario: ShowScenarioId | undefined): boolean {
  const { locale } = useLocale();
  const desktop = useMediaQuery(SHOW_CASE_QUERY);
  return scenario !== undefined && locale === 'en' && desktop;
}
