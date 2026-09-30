/**
 * The live-fix show's scenario manifest (docs/retro/ARCHITECTURE.md §3): step ids, console titles,
 * what each step fixes (for the LLM) and the scripted commentary. Shared by the browser runner and
 * the server's show prompts, so it stays framework-free. Step effects live in the retro screen.
 * Copy comes from docs/design/retro/SPEC.md → POC (round 1), verbatim.
 */

/** Bump whenever the steps change: the server answers an unknown id with `unsupported_version`. */
export const RETRO_SCENARIO_ID = 'retro-1';
export type RetroScenarioId = typeof RETRO_SCENARIO_ID;

/** Steps in show order (POC: 3). */
export const RETRO_STEP_IDS = ['tokens', 'layout', 'rest'] as const;
export type RetroStepId = (typeof RETRO_STEP_IDS)[number];

/** What a narration line is about: a step, or the closing line. */
export const RETRO_NARRATION_KEYS = [...RETRO_STEP_IDS, 'finale'] as const;
export type RetroNarrationKey = (typeof RETRO_NARRATION_KEYS)[number];

export interface RetroStepMeta {
  id: RetroStepId;
  /** Console comment after `// n/N `, e.g. `fonts & colours`. */
  title: string;
  /** For the LLM: what this step fixes, one English line. */
  intent: string;
  /** Scripted commentary when the LLM line is missing. */
  fallback: string;
}

/** In `RETRO_STEP_IDS` order. */
export const RETRO_STEPS: readonly RetroStepMeta[] = [
  {
    id: 'tokens',
    title: 'fonts & colours',
    intent: "Swap the 2002 fonts, text sizes and colours for today's type scale and palette.",
    fallback: 'First, fonts and colours: let me bring them into this decade.',
  },
  {
    id: 'layout',
    title: 'layout',
    intent:
      'Move the page from a narrow table pushed to the left into the centred column and grids.',
    fallback: "Now the layout. It's been leaning left since 2002.",
  },
  {
    id: 'rest',
    title: 'the rest',
    intent:
      'Fix the broken images, turn table cells into cards, fix spacing, remove the marquee, hit counter and other 2002 chrome, and load the real chat button.',
    fallback: 'And the rest: pictures, cards, spacing and that marquee. Fast-forwarding.',
  },
];

export const RETRO_FINALE_FALLBACK =
  "Done. This is Andrew's CV as it looks today. Questions? The chat button is bottom right.";
