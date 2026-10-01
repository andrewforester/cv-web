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
      "Replace the 2002 system fonts (Verdana, Times New Roman, Arial) and small text sizes with today's typeface and type scale.",
    fallback:
      'Starting with typography: replacing the system fonts of the time with the current typeface and type scale.',
  },
  {
    id: 'colours',
    title: 'colours',
    intent:
      "Replace the star-field background and the cream, black, red, purple and cyan colours with today's palette.",
    fallback:
      'Colours: replacing the tiled background and the period palette with the current colour scheme, for readable contrast.',
  },
  {
    id: 'layout',
    title: 'layout',
    intent:
      'Move the page from the fixed-width, left-aligned table layout into the centred column and grids.',
    fallback:
      'Layout: replacing the fixed-width table layout, standard practice at the time, with a centred column and grids.',
  },
  {
    id: 'images',
    title: 'images',
    intent: 'Correct the image paths and the logo aspect ratios, and remove the "Oh, snap!" note.',
    fallback:
      'Images: correcting the asset paths and aspect ratios, so the photo, logos and covers display properly.',
  },
  {
    id: 'cards',
    title: 'cards',
    intent: "Turn the bevelled table cells into today's cards with borders, radius and shadows.",
    fallback:
      'Cards: converting the bevelled table cells into cards, which group related content more clearly.',
  },
  {
    id: 'spacing',
    title: 'spacing & lists',
    intent: "Remove the horizontal rules and bullet lists and restore today's section spacing.",
    fallback:
      'Spacing: replacing the horizontal rules and bullet lists with consistent section spacing, so the page is easier to scan.',
  },
  {
    id: 'chrome',
    title: '2002 chrome',
    intent:
      'Remove the nav bar, marquee, "NEW!" bursts, hit counter, badges and webring, and bring back the language switcher.',
    fallback:
      'Removing the navigation bar, marquee and footer badges of the original build, and restoring the language switcher.',
  },
  {
    id: 'links',
    title: 'links & contacts',
    intent: 'Restore the contact links and icons, and load the real AI chat button.',
    fallback:
      'Finally, contacts: restoring the contact links and icons, and loading the AI chat assistant.',
  },
];

export const RETRO_FINALE_FALLBACK =
  'All changes are applied. The site is up to date; the chat button in the bottom right corner answers questions about Andrew.';
