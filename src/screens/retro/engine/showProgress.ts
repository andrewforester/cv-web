import { addChat, chunkResolved, currentStep } from './showState';
import { revealMs, TIMING, typingMs } from './timing';
import type { EffectRun, PlannedChunk, PlannedStep, ShowState } from './showTypes';

/** Typing time of the current chunk and how many of its characters show at `t`. */
export function chunkTyping(state: ShowState, chunk: PlannedChunk): { ms: number; shown: number } {
  const { reducedMotion } = state.config;
  const ms = typingMs(chunk.chars, reducedMotion);
  if (state.stage !== 'type' || reducedMotion) return { ms, shown: chunk.chars };
  const elapsed = state.t - state.stageAt;
  return { ms, shown: Math.min(chunk.chars, Math.floor((elapsed / ms) * chunk.chars)) };
}

/** Whether the chunk's apply waits for the camera: page-wide and module chunks never scroll. */
const waitsForFocus = (chunk: PlannedChunk) =>
  chunk.target !== null && chunk.target.selectors !== 'page';

/**
 * Show time the current chunk applies: its typing has ended and the camera has settled on its
 * target (`focusSettled`), or the settle cap has passed, whichever comes first.
 */
export function applyDueAt(state: ShowState, chunk: PlannedChunk): number {
  const typedAt = state.stageAt + chunkTyping(state, chunk).ms;
  if (!waitsForFocus(chunk)) return typedAt;
  return Math.max(typedAt, state.focusAt ?? state.stageAt + TIMING.focusSettleCapMs);
}

/** Where a hold at a chunk boundary ends: the latest cap of the holds still on. */
export function holdEndsAt(state: ShowState, heldSince: number): number | null {
  const caps = [
    state.visitor.composing ? heldSince + TIMING.composingCapMs : null,
    state.visitor.request ? heldSince + TIMING.answeringCapMs : null,
  ].filter((cap): cap is number => cap !== null);
  return caps.length ? Math.max(...caps) : null;
}

/**
 * A chunk boundary was reached at `ready`: hold while the visitor types or a reply streams (each
 * up to its cap), else go on at the time the hold ended (`ready` when there was none).
 */
function passBoundary(state: ShowState, ready: number, next: (at: number) => ShowState) {
  const heldSince = state.heldSince ?? ready;
  const endsAt = holdEndsAt(state, heldSince);
  if (endsAt !== null && state.t < endsAt) {
    return state.heldSince === null ? { ...state, heldSince } : state;
  }
  const at = state.heldSince === null ? ready : (endsAt ?? state.t);
  return next(at);
}

function startChunk(state: ShowState, index: number, at: number): ShowState {
  return { ...state, stage: 'type', chunk: index, stageAt: at, focusAt: null, heldSince: null };
}

function enterStep(state: ShowState, index: number, at: number): ShowState {
  const step = state.config.plan.steps[index];
  if (!step) return enterFinale(state, at);
  const moved: ShowState = {
    ...state,
    phase: 'steps',
    step: index,
    chunk: 0,
    stage: 'narrate',
    stageAt: at,
    focusAt: null,
    heldSince: null,
  };
  const text = state.narration[step.id] ?? step.fallback;
  return addChat(moved, { kind: 'agent', text, revealFrom: at, at });
}

function enterFinale(state: ShowState, at: number): ShowState {
  const text = state.narration.finale ?? state.config.plan.finaleFallback;
  const phaseEndsAt = at + revealMs(text, state.config.reducedMotion) + TIMING.closeDelayMs;
  const moved = { ...state, phase: 'finale' as const, phaseEndsAt, heldSince: null };
  return addChat(moved, { kind: 'agent', text, revealFrom: at, at });
}

function withRun(state: ShowState, key: string, run: EffectRun): ShowState {
  return { ...state, effects: { ...state.effects, [key]: run } };
}

/**
 * The current chunk types, applies at its due time (a module starts loading and resolves by
 * event or timeout), then its beat starts when it resolved.
 */
function typeStage(state: ShowState, chunk: PlannedChunk): ShowState {
  const run = state.effects[chunk.key];
  if (run?.status === 'pending') {
    const due = applyDueAt(state, chunk);
    if (state.t < due) return state;
    // A module's 5 s count from when the runner got here: its `import()` can't start earlier.
    const next: EffectRun =
      chunk.effect.kind === 'loadModule'
        ? { status: 'running', at: state.t }
        : { status: 'applied', at: due };
    return typeStage(withRun(state, chunk.key, next), chunk);
  }
  if (run?.status === 'running') {
    const timeoutAt = run.at + TIMING.moduleTimeoutMs;
    if (state.t < timeoutAt || chunk.effect.kind !== 'loadModule') return state;
    const reason = `not loaded after ${TIMING.moduleTimeoutMs / 1000} s`;
    return withRun(state, chunk.key, { status: 'skipped', at: timeoutAt, reason });
  }
  if (!chunkResolved(state, chunk.key)) return state;
  return { ...state, stage: 'beat', stageAt: run?.at ?? state.t };
}

function stepsPhase(state: ShowState, step: PlannedStep): ShowState {
  switch (state.stage) {
    case 'narrate': {
      const ready = state.stageAt + TIMING.narrateMs;
      if (state.t < ready) return state;
      return passBoundary(state, ready, (at) => startChunk(state, 0, at));
    }
    case 'type': {
      const chunk = step.chunks[state.chunk];
      return chunk ? typeStage(state, chunk) : { ...state, stage: 'stepDone' };
    }
    case 'beat': {
      const ready = state.stageAt + TIMING.beatMs;
      if (state.t < ready) return state;
      const next = state.chunk + 1;
      if (next >= step.chunks.length) return { ...state, stage: 'stepDone', stageAt: ready };
      return passBoundary(state, ready, (at) => startChunk(state, next, at));
    }
    case 'stepDone': {
      const ready = state.stageAt + TIMING.stepDoneMs;
      if (state.t < ready) return state;
      return passBoundary(state, ready, (at) => enterStep(state, state.step + 1, at));
    }
  }
}

function once(state: ShowState): ShowState {
  const { copy, reducedMotion } = state.config;
  const at = state.phaseEndsAt;
  if (state.phase !== 'steps' && state.phase !== 'done' && state.t < at) return state;
  switch (state.phase) {
    case 'idle': {
      const phaseEndsAt = at + revealMs(copy.greeting, reducedMotion) + TIMING.consoleDelayMs;
      return addChat(
        { ...state, phase: 'chat', phaseEndsAt },
        { kind: 'system', text: copy.systemJoin, revealFrom: null, at },
        { kind: 'system', text: copy.systemJoined, revealFrom: null, at },
        { kind: 'agent', text: copy.greeting, revealFrom: at, at },
      );
    }
    case 'chat': {
      const phaseEndsAt = at + revealMs(copy.handoff, reducedMotion);
      return addChat(
        { ...state, phase: 'console', phaseEndsAt },
        { kind: 'agent', text: copy.handoff, revealFrom: at, at },
      );
    }
    case 'console':
      return enterStep(state, 0, at);
    case 'steps': {
      const step = currentStep(state);
      return step ? stepsPhase(state, step) : enterFinale(state, state.t);
    }
    case 'finale':
      return {
        ...state,
        phase: 'closing',
        phaseEndsAt: at + (reducedMotion ? 0 : TIMING.closingMs),
      };
    case 'closing':
      return { ...state, phase: 'done' };
    case 'done':
      return state;
  }
}

/** Runs the show forward to the current show time: every transition that is due happens. */
export function progress(state: ShowState): ShowState {
  let current = state;
  for (let guard = 0; guard < 1_000; guard++) {
    const next = once(current);
    if (next === current) return current;
    current = next;
  }
  return current;
}
