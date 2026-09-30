/**
 * The live-fix show's scenario manifest (docs/retro/ARCHITECTURE.md §3): step ids, console titles,
 * what each step fixes (for the LLM) and the scripted commentary. Shared by the browser runner and
 * the server's show prompts, so it stays framework-free. Step effects live in the retro screen.
 * Copy comes from docs/design/retro/SPEC.md → The fix list and Texts, verbatim.
 */

/** Bump whenever the steps change: the server answers an unknown id with `unsupported_version`. */
export const RETRO_SCENARIO_ID = 'retro-3';
export type RetroScenarioId = typeof RETRO_SCENARIO_ID;

/** Steps in show order: one concern each, one narration line each. */
export const RETRO_STEP_IDS = [
  'fonts',
  'colours',
  'layout',
  'images',
  'cards',
  'spacing',
  'chrome',
  'links',
] as const;
export type RetroStepId = (typeof RETRO_STEP_IDS)[number];
/** What a narration line is about: a step, or the closing line. */
export const RETRO_NARRATION_KEYS = [...RETRO_STEP_IDS, 'finale'] as const;
export type RetroNarrationKey = (typeof RETRO_NARRATION_KEYS)[number];

export interface RetroStepMeta {
  id: RetroStepId;
  /** Console comment after `// n/N `, e.g. `spacing & lists`. */
  title: string;
  /** For the LLM: what this step fixes, one English line. */
  intent: string;
  /** Scripted commentary when the LLM line is missing. */
  fallback: string;
}

/** In `RETRO_STEP_IDS` order. */
export const RETRO_STEPS: readonly RetroStepMeta[] = [
  {
    id: 'fonts',
    title: 'fonts',
    intent:
      "Swap the 2002 typefaces (Verdana, Times New Roman, Arial) and tiny text sizes for today's font and type scale.",
    fallback: 'First, the fonts: let me bring them into this decade.',
  },
  {
    id: 'colours',
    title: 'colours',
    intent:
      "Replace the star-field background and the cream, black, red, purple and cyan colours with today's palette.",
    fallback: 'Now the colours. Goodbye, star field.',
  },
  {
    id: 'layout',
    title: 'layout',
    intent:
      'Move the page from a narrow table pushed to the left into the centred column and grids.',
    fallback: "Now the layout. It's been leaning left since 2002.",
  },
  {
    id: 'images',
    title: 'images',
    intent: 'Fix the broken image paths and the squashed logos, and remove the "Oh, snap!" note.',
    fallback: 'The pictures were in the wrong folder. Fixing the paths.',
  },
  {
    id: 'cards',
    title: 'cards',
    intent: "Turn the bevelled table cells into today's cards with borders, radius and shadows.",
    fallback: 'Tables are for data. Turning these into cards.',
  },
  {
    id: 'spacing',
    title: 'spacing & lists',
    intent: "Remove the horizontal rules and bullet lists and restore today's section spacing.",
    fallback: 'Giving everything room to breathe. Goodbye, <hr>.',
  },
  {
    id: 'chrome',
    title: '2002 chrome',
    intent:
      'Remove the nav bar, marquee, "NEW!" bursts, hit counter, badges and webring, and bring back the language switcher.',
    fallback: 'Time to say goodbye to the marquee and the hit counter.',
  },
  {
    id: 'links',
    title: 'links & contacts',
    intent: 'Restore the contact links and icons, and load the real AI chat button.',
    fallback: 'Last: links, contacts, and a real chat button.',
  },
];

export const RETRO_FINALE_FALLBACK =
  "Done. This is Andrew's CV as it looks today. Questions? The chat button is bottom right.";
