/**
 * The `/new` show's manifest (docs/retro/ARCHITECTURE.md §10): `/`'s eight step ids and console
 * titles, with intents and scripted commentary about `/new`'s own content. Copy comes from
 * docs/design/retro/SPEC.md → 2001 `/new` → The fix list and Texts, verbatim. Step effects live
 * in the retro screen's `/new` source.
 */
import { RETRO_FINALE_FALLBACK, type RetroStepMeta } from './scenario.js';

/** Bump whenever `/new`'s steps change: the server answers an unknown id with `unsupported_version`. */
export const RETRO_NEW_SCENARIO_ID = 'retro-new-1';

/** In `RETRO_STEP_IDS` order. */
export const RETRO_NEW_STEPS: readonly RetroStepMeta[] = [
  {
    id: 'fonts',
    title: 'fonts',
    intent:
      "Replace the 2002 system fonts (Verdana, Times New Roman, Arial, Courier New) and small sizes with today's typeface and type scale: the AI Product Engineer headline, the impact figures and the process panel.",
    fallback:
      'Starting with typography: the current typeface and type scale, so the headline and the impact figures read at a glance.',
  },
  {
    id: 'colours',
    title: 'colours',
    intent:
      'Replace the star-field background, the cream page and the flat navy and black panels with today\'s palette and gradients: the featured impact card and the dark "How I build with agents" panel.',
    fallback:
      'Colours: replacing the tiled background and the period palette with the current colour scheme, including the impact and process panels.',
  },
  {
    id: 'layout',
    title: 'layout',
    intent:
      'Move the page from the fixed-width, left-aligned table into the centred column: the hero beside the photo, the impact figures in one row, the job rows and the skills grid.',
    fallback:
      'Layout: replacing the fixed-width table layout, standard practice at the time, with a centred column and grids.',
  },
  {
    id: 'images',
    title: 'images',
    intent:
      'Correct the image paths and the app icons\' aspect ratios so the photo, the app icons and the book covers load, and remove the "Oh, snap!" note.',
    fallback:
      'Images: correcting the asset paths and aspect ratios, so the photo, app icons and book covers display properly.',
  },
  {
    id: 'cards',
    title: 'cards',
    intent:
      "Turn the bevelled table cells into today's impact cards, the framed process panel, app pills, skill rows and the education and about cards.",
    fallback:
      'Cards: converting the bevelled table cells into impact cards, the process panel, app pills and skill rows.',
  },
  {
    id: 'spacing',
    title: 'spacing & lists',
    intent:
      "Remove the horizontal rules and the numbered and square-bullet lists, and restore today's section spacing, the six loop steps as tiles and the job bullets.",
    fallback:
      'Spacing: replacing the horizontal rules and numbered lists with consistent section spacing, so the page is easier to scan.',
  },
  {
    id: 'chrome',
    title: '2002 chrome',
    intent:
      'Remove the nav bar, marquee, "NEW!" bursts, hit counter, badges and webring, and bring back the meta bar with location, availability and the language switcher.',
    fallback:
      'Removing the navigation bar, marquee and footer badges of the original build, and restoring the meta bar.',
  },
  {
    id: 'links',
    title: 'links & contacts',
    intent:
      'Restore the contact rows with their arrows (email, phone, the live AI CV) and the footer link, and load the real AI chat button.',
    fallback:
      'Finally, links: restoring the contact rows and the footer link, and loading the AI chat assistant.',
  },
];

/** Not shown since Round 5; the same closing line as `/`. */
export const RETRO_NEW_FINALE_FALLBACK = RETRO_FINALE_FALLBACK;
