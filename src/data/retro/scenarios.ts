/**
 * The show's scenarios, one per page that has a Show case (docs/retro/ARCHITECTURE.md §10): the
 * registry the browser and the server read. Framework-free; `.js` specifiers because `server/**`
 * runs this file on Node. What each step does to its page lives in the retro screen's sources.
 */
import type { ChatPage } from '../chat/contract.js';
import {
  RETRO_FINALE_FALLBACK,
  RETRO_SCENARIO_ID,
  RETRO_STEPS,
  type RetroStepMeta,
} from './scenario.js';
import {
  RETRO_NEW_FINALE_FALLBACK,
  RETRO_NEW_SCENARIO_ID,
  RETRO_NEW_STEPS,
} from './scenarioNew.js';

export interface ShowScenarioManifest {
  /** The wire `scenario` value. */
  id: string;
  /** Whose content grounds the in-show replies (the chat's page id, ADR-0004). */
  page: ChatPage;
  /** In `RETRO_STEP_IDS` order: every scenario has the same eight step ids. */
  steps: readonly RetroStepMeta[];
  /** Scripted closing line when the LLM's `finale` is missing. */
  finale: string;
}

/** Every known scenario by its wire id; a page's scenario is registered here with its manifest. */
export const SHOW_SCENARIOS = {
  [RETRO_SCENARIO_ID]: {
    id: RETRO_SCENARIO_ID,
    page: 'cv',
    steps: RETRO_STEPS,
    finale: RETRO_FINALE_FALLBACK,
  },
  [RETRO_NEW_SCENARIO_ID]: {
    id: RETRO_NEW_SCENARIO_ID,
    page: 'profile',
    steps: RETRO_NEW_STEPS,
    finale: RETRO_NEW_FINALE_FALLBACK,
  },
} as const satisfies Record<string, ShowScenarioManifest>;

export type ShowScenarioId = keyof typeof SHOW_SCENARIOS;

/** A known scenario id; anything else is answered with `unsupported_version`. */
export function isShowScenarioId(value: unknown): value is ShowScenarioId {
  return typeof value === 'string' && Object.hasOwn(SHOW_SCENARIOS, value);
}
