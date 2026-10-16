import { isShowScenarioId } from '../data/retro';
import { SHOW_SCENARIO } from './showScenarios';

describe('SHOW_SCENARIO', () => {
  it('runs retro-4 on the one page, a known scenario', () => {
    expect(SHOW_SCENARIO).toBe('retro-4');
    expect(isShowScenarioId(SHOW_SCENARIO)).toBe(true);
  });
});
