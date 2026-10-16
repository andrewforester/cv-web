/**
 * The show's scenarios (docs/retro/ARCHITECTURE.md §11): the registry the browser and the server
 * read. One page, one scenario, `retro-4`; replies always ground in the one page's knowledge.
 * Framework-free; `.js` specifiers because `server/**` runs this file on Node. What each step does
 * to the page lives in the retro screen's source.
 */
import {
  RETRO_FINALE_FALLBACK,
  RETRO_SCENARIO_ID,
  RETRO_STEPS,
  type RetroStepMeta,
} from './scenario.js';

export interface ShowScenarioManifest {
  /** The wire `scenario` value. */
  id: string;
  /** In `RETRO_STEP_IDS` order. */
  steps: readonly RetroStepMeta[];
  /** Scripted closing line when the LLM's `finale` is missing. */
  finale: string;
}

/** Every known scenario by its wire id; an id is bumped when its steps change. */
export const SHOW_SCENARIOS = {
  [RETRO_SCENARIO_ID]: {
    id: RETRO_SCENARIO_ID,
    steps: RETRO_STEPS,
    finale: RETRO_FINALE_FALLBACK,
  },
} as const satisfies Record<string, ShowScenarioManifest>;

export type ShowScenarioId = keyof typeof SHOW_SCENARIOS;

/** A known scenario id; anything else (`retro-3`, `retro-new-1` …) gets `unsupported_version`. */
export function isShowScenarioId(value: unknown): value is ShowScenarioId {
  return typeof value === 'string' && Object.hasOwn(SHOW_SCENARIOS, value);
}
