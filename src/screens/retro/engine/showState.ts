import type { RetroStepId } from '../../../data/retro';
import { TIMING } from './timing';
import type {
  ChatEntry,
  PlannedChunk,
  PlannedStep,
  ShowConfig,
  ShowPhase,
  ShowState,
} from './showTypes';

/** The show before anything happened: the broken page alone. `now` is the clock reading. */
export function createShowState(config: ShowConfig, now: number): ShowState {
  const effects = Object.fromEntries(
    config.plan.steps.flatMap((step) =>
      step.chunks.map(({ key }) => [key, { status: 'pending' as const, at: 0 }]),
    ),
  );
  return {
    config,
    t: 0,
    now,
    hidden: false,
    phase: 'idle',
    phaseEndsAt: TIMING.introDelayMs,
    step: 0,
    chunk: 0,
    stage: 'narrate',
    stageAt: 0,
    comment: [],
    focusAt: null,
    focusScrolled: false,
    heldSince: null,
    effects,
    chat: [],
    nextId: 1,
    narration: {},
    visitor: {
      composing: false,
      sent: 0,
      failuresInRow: 0,
      scripted: !config.llm,
      offline: false,
      request: null,
      replyEntry: null,
      exchanges: [],
    },
  };
}

/** Moves show time to the clock reading `now`; while hidden the show time stands still. */
export function advanceClock(state: ShowState, now: number): ShowState {
  if (now === state.now) return state;
  const t = state.hidden ? state.t : state.t + Math.max(0, now - state.now);
  return { ...state, t, now };
}

export type NewEntry = Omit<ChatEntry, 'id' | 'wallAt'> & { at?: number };

/** Appends chat entries; `at` (show time, default now) sets the `[HH:MM]` stamp. */
export function addChat(state: ShowState, ...entries: NewEntry[]): ShowState {
  let id = state.nextId;
  const added = entries.map(({ at, ...entry }): ChatEntry => {
    const wallAt = state.now - (state.t - (at ?? state.t));
    return { ...entry, id: id++, wallAt };
  });
  return { ...state, chat: [...state.chat, ...added], nextId: id };
}

const ENDED: readonly ShowPhase[] = ['finale', 'undock', 'outro', 'closing', 'done'];

/** Every step has run: `✓ All fixes applied.`, the windows closing one by one, or done. */
export function showEnded(state: ShowState): boolean {
  return ENDED.includes(state.phase);
}

export function currentStep(state: ShowState): PlannedStep | undefined {
  return state.phase === 'steps' ? state.config.plan.steps[state.step] : undefined;
}

/** The chunk typing or in its beat; `undefined` during a step's narration and `stepDone`. */
export function currentPlannedChunk(state: ShowState): PlannedChunk | undefined {
  if (state.stage !== 'type' && state.stage !== 'beat') return undefined;
  return currentStep(state)?.chunks[state.chunk];
}

/** Whether a chunk has applied or been skipped. */
export function chunkResolved(state: ShowState, key: string): boolean {
  const status = state.effects[key]?.status;
  return status === 'applied' || status === 'skipped';
}

/** Steps finished so far (the reply request's `stepsDone`). */
export function stepsDone(state: ShowState): number {
  const total = state.config.plan.steps.length;
  if (showEnded(state)) return total;
  if (state.phase !== 'steps') return 0;
  return state.step + (state.stage === 'stepDone' ? 1 : 0);
}

/** The step on screen for the reply request: `null` before the first step. */
export function stepOnScreen(state: ShowState): RetroStepId | null {
  const steps = state.config.plan.steps;
  if (showEnded(state)) return steps.at(-1)?.id ?? null;
  return currentStep(state)?.id ?? null;
}
