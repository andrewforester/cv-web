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
    expect(RETRO_SCENARIO_ID).toBe('retro-4');
    expect(RETRO_STEPS.map((step) => step.title)).toEqual([
      'fonts',
      'colours',
      'layout',
      'images',
      'cards',
      'spacing & lists',
      '2002 chrome',
      'links & contacts',
    ]);
    expect(RETRO_STEPS.map((step) => step.fallback)).toEqual([
      'Starting with typography: the current typeface and type scale, so the headline, the stats and the impact figures read at a glance.',
      'Colours: replacing the tiled background and the period palette with the current colour scheme, including the process panel and the footer.',
      'Layout: replacing the fixed-width table layout, standard practice at the time, with a centred column and grids.',
      'Images: correcting the asset paths and aspect ratios, so the photo, project icons and book covers display properly.',
      'Cards: converting the bevelled table cells into stat tiles, craft and impact cards, the process panel and skill rows.',
      'Spacing: replacing the horizontal rules and bullet lists with consistent section spacing, so the page is easier to scan.',
      'Removing the navigation bar, marquee and footer badges of the original build, and restoring the meta bar.',
      'Finally, links: restoring the contact buttons and the footer links, and loading the AI chat assistant.',
    ]);
    expect(RETRO_FINALE_FALLBACK).toBe(
      'All changes are applied. The site is up to date; the chat button in the bottom right corner answers questions about Andrew.',
    );
  });
});
