import { RETRO_LIMITS } from './contract';
import {
  RETRO_FINALE_FALLBACK,
  RETRO_NARRATION_KEYS,
  RETRO_SCENARIO_ID,
  RETRO_STEP_IDS,
  RETRO_STEPS,
} from './scenario';

describe('retro scenario manifest', () => {
  it('lists every step once, in RETRO_STEP_IDS order', () => {
    const ids = RETRO_STEPS.map((step) => step.id);
    expect(ids).toEqual([...RETRO_STEP_IDS]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique narration keys: the steps, then the finale', () => {
    expect(RETRO_NARRATION_KEYS).toEqual([...RETRO_STEP_IDS, 'finale']);
    expect(new Set(RETRO_NARRATION_KEYS).size).toBe(RETRO_NARRATION_KEYS.length);
  });

  it.each(RETRO_STEPS)('step $id has a title, a one-line intent and a fallback', (step) => {
    for (const text of [step.title, step.intent, step.fallback]) {
      expect(text.trim()).toBe(text);
      expect(text).not.toBe('');
      expect(text).not.toMatch(/\n/);
    }
  });

  it('keeps every fallback within the narration line limit', () => {
    const fallbacks = [...RETRO_STEPS.map((step) => step.fallback), RETRO_FINALE_FALLBACK];
    for (const text of fallbacks) {
      expect(text.length).toBeGreaterThan(0);
      expect(text.length).toBeLessThanOrEqual(RETRO_LIMITS.maxNarrationLineChars);
    }
  });

  it('uses the design package copy verbatim', () => {
    expect(RETRO_SCENARIO_ID).toBe('retro-1');
    expect(RETRO_STEPS.map((step) => step.title)).toEqual([
      'fonts & colours',
      'layout',
      'the rest',
    ]);
    expect(RETRO_STEPS[1]?.fallback).toBe("Now the layout. It's been leaning left since 2002.");
    expect(RETRO_FINALE_FALLBACK).toBe(
      "Done. This is Andrew's CV as it looks today. Questions? The chat button is bottom right.",
    );
  });
});
