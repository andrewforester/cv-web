import { RETRO_LIMITS } from './contract';
import { RETRO_FINALE_FALLBACK, RETRO_SCENARIO_ID, RETRO_STEP_IDS, RETRO_STEPS } from './scenario';
import { isShowScenarioId, SHOW_SCENARIOS } from './scenarios';

const manifests = Object.entries(SHOW_SCENARIOS);

describe('show scenarios registry', () => {
  it('registers `/` as retro-3, with its manifest unchanged', () => {
    expect(SHOW_SCENARIOS[RETRO_SCENARIO_ID]).toEqual({
      id: 'retro-3',
      page: 'cv',
      steps: RETRO_STEPS,
      finale: RETRO_FINALE_FALLBACK,
    });
  });

  it.each(manifests)('%s: keyed by its id, with the eight step ids in order', (key, manifest) => {
    expect(manifest.id).toBe(key);
    expect(manifest.steps.map(({ id }) => id)).toEqual([...RETRO_STEP_IDS]);
  });

  it.each(manifests)('%s: fallbacks fit the narration line limit', (_, { steps, finale }) => {
    for (const text of [...steps.map(({ fallback }) => fallback), finale]) {
      expect(text.trim()).not.toBe('');
      expect(text.length).toBeLessThanOrEqual(RETRO_LIMITS.maxNarrationLineChars);
    }
  });

  it('knows only registered ids', () => {
    expect(isShowScenarioId(RETRO_SCENARIO_ID)).toBe(true);
    for (const value of ['retro-1', 'retro-2', '', 'toString', '__proto__', 3, null, undefined]) {
      expect(isShowScenarioId(value)).toBe(false);
    }
  });
});
