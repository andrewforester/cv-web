import { RETRO_LIMITS } from './contract';
import { RETRO_FINALE_FALLBACK, RETRO_SCENARIO_ID, RETRO_STEP_IDS, RETRO_STEPS } from './scenario';
import { isShowScenarioId, SHOW_SCENARIOS } from './scenarios';

const manifests = Object.entries(SHOW_SCENARIOS);

describe('show scenarios registry', () => {
  it('registers the one page as retro-4, and nothing else', () => {
    expect(SHOW_SCENARIOS).toEqual({
      'retro-4': { id: 'retro-4', steps: RETRO_STEPS, finale: RETRO_FINALE_FALLBACK },
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

  it('knows only registered ids: the per-page scenarios of before are unknown', () => {
    expect(isShowScenarioId(RETRO_SCENARIO_ID)).toBe(true);
    for (const value of [
      'retro-1',
      'retro-3',
      'retro-new-1',
      '',
      'toString',
      '__proto__',
      3,
      null,
      undefined,
    ]) {
      expect(isShowScenarioId(value)).toBe(false);
    }
  });
});
