import { narrationComment } from './consolePlan';
import { addChat, chunkResolved, currentStep } from './showState';
import { commentMs, revealMs, TIMING, typingMs } from './timing';
import type { EffectRun, PlannedChunk, PlannedStep, ShowPhase, ShowState } from './showTypes';

/** Typing time of the current chunk and how many of its characters show at `t`. */
export function chunkTyping(state: ShowState, chunk: PlannedChunk): { ms: number; shown: number } {
  const { reducedMotion } = state.config;
  const ms = typingMs(chunk.chars, reducedMotion);
  if (state.stage !== 'type' || reducedMotion) return { ms, shown: chunk.chars };
  const elapsed = state.t - state.stageAt;
  return { ms, shown: Math.min(chunk.chars, Math.floor((elapsed / ms) * chunk.chars)) };
}

/** Typing time of the step's narration comment and how many of its characters show at `t`. */
export function commentTyping(state: ShowState): { ms: number; shown: number } {
  const chars = state.comment.reduce((sum, line) => sum + line.length, 0);
  const ms = commentMs(chars, state.config.reducedMotion);
  if (state.stage !== 'narrate' || ms === 0) return { ms, shown: chars };
  const elapsed = state.t - state.stageAt;
  return { ms, shown: Math.min(chars, Math.floor((elapsed / ms) * chars)) };
}

/** Show time the step's first chunk may start: its comment is typed and has been read. */
export function narrateEndsAt(state: ShowState): number {
  return state.stageAt + commentTyping(state).ms + TIMING.narrateMs;
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

/** A step starts with its narration typed into the console as comments; the chat stays silent. */
function enterStep(state: ShowState, index: number, at: number): ShowState {
  const step = state.config.plan.steps[index];
  if (!step) return enterFinale(state, at);
  return {
    ...state,
    phase: 'steps',
    step: index,
    chunk: 0,
    stage: 'narrate',
    stageAt: at,
    comment: narrationComment(state.narration[step.id] ?? step.fallback),
    focusAt: null,
    heldSince: null,
  };
}

/** Every step has run: `✓ All fixes applied.` stays a moment before the windows close. */
function enterFinale(state: ShowState, at: number): ShowState {
  const phaseEndsAt = at + TIMING.finaleHoldMs;
  return { ...state, phase: 'finale', phaseEndsAt, heldSince: null };
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
      const ready = narrateEndsAt(state);
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

/** Enters `phase` with a scripted chat line; the phase ends `pauseMs` after it has typed. */
function say(state: ShowState, phase: ShowPhase, text: string, at: number, pauseMs: number) {
  const phaseEndsAt = at + revealMs(text, state.config.reducedMotion) + pauseMs;
  return addChat({ ...state, phase, phaseEndsAt }, { kind: 'agent', text, revealFrom: at, at });
}

function once(state: ShowState): ShowState {
  const { copy, reducedMotion } = state.config;
  const at = state.phaseEndsAt;
  if (state.phase !== 'steps' && state.phase !== 'done' && state.t < at) return state;
  const motionMs = (ms: number) => (reducedMotion ? 0 : ms);
  switch (state.phase) {
    case 'idle':
      return say(state, 'intro', copy.introLine, at, TIMING.introPauseMs);
    case 'intro':
      return say(state, 'handoff', copy.fixLine, at, TIMING.consoleDelayMs);
    case 'handoff':
      return { ...state, phase: 'console', phaseEndsAt: at + TIMING.consoleLeadMs };
    case 'console':
      return enterStep(state, 0, at);
    case 'steps': {
      const step = currentStep(state);
      return step ? stepsPhase(state, step) : enterFinale(state, state.t);
    }
    case 'finale': {
      const phaseEndsAt = at + motionMs(TIMING.undockMs) + TIMING.outroDelayMs;
      return { ...state, phase: 'undock', phaseEndsAt };
    }
    case 'undock':
      return say(state, 'outro', copy.closingLine, at, TIMING.outroHoldMs);
    case 'outro':
      return { ...state, phase: 'closing', phaseEndsAt: at + motionMs(TIMING.closingMs) };
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
