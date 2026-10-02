import { isShowScenarioId } from '../data/retro';
import { SHOW_SCENARIO_BY_PAGE, showScenarioFor } from './showScenarios';

describe('showScenarioFor', () => {
  it('runs retro-3 on /', () => {
    expect(showScenarioFor('cv')).toBe('retro-3');
  });

  it('has no show on /new yet', () => {
    expect(showScenarioFor('profile')).toBeUndefined();
  });

  it('maps pages only to known scenarios', () => {
    for (const scenario of Object.values(SHOW_SCENARIO_BY_PAGE)) {
      expect(isShowScenarioId(scenario)).toBe(true);
    }
  });
});
