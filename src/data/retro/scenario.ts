/**
 * The live-fix show's scenario manifest (docs/retro/ARCHITECTURE.md §3, §11): step ids, console
 * titles, what each step fixes (for the LLM) and the scripted commentary. Shared by the browser
 * runner and the server's show prompts, so it stays framework-free. Step effects live in the retro
 * screen. Copy: docs/design/retro/SPEC.md → 2001 `/new` → Texts, reworded for the v3 page
 * (SPEC → v3 refit).
 */

/** Bump whenever the steps change: the server answers an unknown id with `unsupported_version`. */
export const RETRO_SCENARIO_ID = 'retro-4';

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
      "Replace the 2002 system fonts (Verdana, Times New Roman, Arial, Courier New) and small sizes with today's typeface and type scale: the Senior Software Product Engineer headline, the stats and the impact figures.",
    fallback:
      'Starting with typography: the current typeface and type scale, so the headline, the stats and the impact figures read at a glance.',
  },
  {
    id: 'colours',
    title: 'colours',
    intent:
      'Replace the star-field background, the cream page and the flat navy and black panels with today\'s palette and gradients: the AI stat tile, the dark "How I build with agents" panel and the footer.',
    fallback:
      'Colours: replacing the tiled background and the period palette with the current colour scheme, including the process panel and the footer.',
  },
  {
    id: 'layout',
    title: 'layout',
    intent:
      'Move the page from the fixed-width, left-aligned table into the centred page card: the header beside the photo, the craft and impact cards in rows, the job rows and the skills grid.',
    fallback:
      'Layout: replacing the fixed-width table layout, standard practice at the time, with a centred column and grids.',
  },
  {
    id: 'images',
    title: 'images',
    intent:
      'Correct the image paths and the app icons\' aspect ratios so the photo, the project icons and the book covers load, and remove the "Oh, snap!" note.',
    fallback:
      'Images: correcting the asset paths and aspect ratios, so the photo, project icons and book covers display properly.',
  },
  {
    id: 'cards',
    title: 'cards',
    intent:
      "Turn the bevelled table cells into today's stat tiles, craft cards, impact cards, the process panel, the project tree, skill rows and the education and about cards.",
    fallback:
      'Cards: converting the bevelled table cells into stat tiles, craft and impact cards, the process panel and skill rows.',
  },
  {
    id: 'spacing',
    title: 'spacing & lists',
    intent:
      "Remove the horizontal rules, the square-bullet lists and the plain step rows, and restore today's section spacing, the six loop steps as tiles, the project tree and the job bullets.",
    fallback:
      'Spacing: replacing the horizontal rules and bullet lists with consistent section spacing, so the page is easier to scan.',
  },
  {
    id: 'chrome',
    title: '2002 chrome',
    intent:
      'Remove the nav bar, marquee, "NEW!" bursts, hit counter, badges and webring, and bring back the meta bar with location and availability.',
    fallback:
      'Removing the navigation bar, marquee and footer badges of the original build, and restoring the meta bar.',
  },
  {
    id: 'links',
    title: 'links & contacts',
    intent:
      'Restore the contact buttons (Email me, WhatsApp, Telegram, LinkedIn) and the footer\'s "Let\'s build something" with its links, and load the real "Ask my AI" chat.',
    fallback:
      'Finally, links: restoring the contact buttons and the footer links, and loading the AI chat assistant.',
  },
];

export const RETRO_FINALE_FALLBACK =
  'All changes are applied. The site is up to date; the chat button in the bottom right corner answers questions about Andrew.';
