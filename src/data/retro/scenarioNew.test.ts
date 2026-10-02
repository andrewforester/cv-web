import { RETRO_LIMITS } from './contract';
import { RETRO_FINALE_FALLBACK, RETRO_SCENARIO_ID, RETRO_STEP_IDS, RETRO_STEPS } from './scenario';
import { RETRO_NEW_FINALE_FALLBACK, RETRO_NEW_SCENARIO_ID, RETRO_NEW_STEPS } from './scenarioNew';

describe('/new scenario manifest', () => {
  it('has its own id and every step once, in RETRO_STEP_IDS order', () => {
    expect(RETRO_NEW_SCENARIO_ID).toBe('retro-new-1');
    expect(RETRO_NEW_SCENARIO_ID).not.toBe(RETRO_SCENARIO_ID);
    expect(RETRO_NEW_STEPS.map((step) => step.id)).toEqual([...RETRO_STEP_IDS]);
  });

  it("keeps `/`'s console titles", () => {
    expect(RETRO_NEW_STEPS.map((step) => step.title)).toEqual(
      RETRO_STEPS.map((step) => step.title),
    );
  });

  it.each(RETRO_NEW_STEPS)('step $id has a one-line intent and fallback', (step) => {
    for (const text of [step.intent, step.fallback]) {
      expect(text.trim()).toBe(text);
      expect(text).not.toBe('');
      expect(text).not.toMatch(/\n/);
    }
  });

  it('keeps every fallback within the narration line limit', () => {
    for (const text of [
      ...RETRO_NEW_STEPS.map((step) => step.fallback),
      RETRO_NEW_FINALE_FALLBACK,
    ]) {
      expect(text.length).toBeLessThanOrEqual(RETRO_LIMITS.maxNarrationLineChars);
    }
  });

  it('uses the design package copy verbatim', () => {
    expect(RETRO_NEW_STEPS.map((step) => step.fallback)).toEqual([
      'Starting with typography: the current typeface and type scale, so the headline and the impact figures read at a glance.',
      'Colours: replacing the tiled background and the period palette with the current colour scheme, including the impact and process panels.',
      'Layout: replacing the fixed-width table layout, standard practice at the time, with a centred column and grids.',
      'Images: correcting the asset paths and aspect ratios, so the photo, app icons and book covers display properly.',
      'Cards: converting the bevelled table cells into impact cards, the process panel, app pills and skill rows.',
      'Spacing: replacing the horizontal rules and numbered lists with consistent section spacing, so the page is easier to scan.',
      'Removing the navigation bar, marquee and footer badges of the original build, and restoring the meta bar.',
      'Finally, links: restoring the contact rows and the footer link, and loading the AI chat assistant.',
    ]);
    expect(RETRO_NEW_STEPS.map((step) => step.intent)).toEqual([
      "Replace the 2002 system fonts (Verdana, Times New Roman, Arial, Courier New) and small sizes with today's typeface and type scale: the AI Product Engineer headline, the impact figures and the process panel.",
      'Replace the star-field background, the cream page and the flat navy and black panels with today\'s palette and gradients: the featured impact card and the dark "How I build with agents" panel.',
      'Move the page from the fixed-width, left-aligned table into the centred column: the hero beside the photo, the impact figures in one row, the job rows and the skills grid.',
      'Correct the image paths and the app icons\' aspect ratios so the photo, the app icons and the book covers load, and remove the "Oh, snap!" note.',
      "Turn the bevelled table cells into today's impact cards, the framed process panel, app pills, skill rows and the education and about cards.",
      "Remove the horizontal rules and the numbered and square-bullet lists, and restore today's section spacing, the six loop steps as tiles and the job bullets.",
      'Remove the nav bar, marquee, "NEW!" bursts, hit counter, badges and webring, and bring back the meta bar with location, availability and the language switcher.',
      'Restore the contact rows with their arrows (email, phone, the live AI CV) and the footer link, and load the real AI chat button.',
    ]);
    expect(RETRO_NEW_FINALE_FALLBACK).toBe(RETRO_FINALE_FALLBACK);
  });
});
