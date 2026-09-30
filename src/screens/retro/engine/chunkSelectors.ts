import { currentPlannedChunk } from './showState';
import { TIMING } from './timing';
import type { ChunkMotion, ChunkTarget, ShowState } from './showTypes';

/** The attribute the app shell puts on the page while the show runs; targets resolve under it. */
export const STAGE_SELECTOR = '[data-retro-stage]';

/** A chunk target selector as a document query: a hook under the stage, a decoration by its id. */
export function targetQuery(selector: string): string {
  return selector.startsWith('#') ? selector : `${STAGE_SELECTOR} ${selector}`;
}

export interface CurrentChunk {
  key: string;
  target: ChunkTarget | null;
  motion: ChunkMotion;
  /** `typing` until it applies (a module: until it loads), then its beat. */
  status: 'typing' | 'applied' | 'skipped';
  /** Show time it applied or was skipped; `null` while typing. */
  appliedAt: number | null;
}

/** The chunk typing or in its beat (ARCHITECTURE §9 → Runner), for the stage's motion and camera. */
export function currentChunk(state: ShowState): CurrentChunk | null {
  const chunk = currentPlannedChunk(state);
  if (!chunk) return null;
  const run = state.effects[chunk.key];
  const status = run?.status === 'applied' || run?.status === 'skipped' ? run.status : 'typing';
  return {
    key: chunk.key,
    target: chunk.target,
    motion: chunk.motion,
    status,
    appliedAt: status === 'typing' ? null : (run?.at ?? null),
  };
}

/**
 * Decorations removed less than `leaveMs` ago: still rendered with a leaving modifier while they
 * fade out, then gone. None with reduced motion (they go at once).
 */
export function leavingDecorations(state: ShowState): string[] {
  if (state.config.reducedMotion || state.phase === 'done') return [];
  return state.config.plan.decorations.filter((id) => {
    const run = state.effects[`decoration:${id}`];
    return run?.status === 'applied' && state.t < run.at + TIMING.leaveMs;
  });
}

export interface ShowHighlight {
  key: string;
  /** `typing`: outline; `applied`: fill flash, held briefly; `fading`: gone by the beat's end. */
  phase: 'typing' | 'applied' | 'fading';
  /** A page-wide chunk: a frame around the page area instead of boxes. */
  page: boolean;
  /** Document queries of the elements to frame (`targetQuery`); empty for `page`. */
  queries: readonly string[];
}

/**
 * What the show's highlight marks now (SPEC → Show what changed): the current chunk's target from
 * the start of its typing until its beat ends. `null` between chunks and for the module chunk.
 */
export function highlightOf(state: ShowState): ShowHighlight | null {
  const chunk = currentChunk(state);
  if (!chunk?.target) return null;
  const { selectors } = chunk.target;
  const base = {
    key: chunk.key,
    page: selectors === 'page',
    queries: selectors === 'page' ? [] : selectors.map(targetQuery),
  };
  if (chunk.appliedAt === null) return { ...base, phase: 'typing' };
  const since = state.t - chunk.appliedAt;
  if (since >= TIMING.beatMs) return null;
  return { ...base, phase: since < TIMING.highlightHoldMs ? 'applied' : 'fading' };
}
