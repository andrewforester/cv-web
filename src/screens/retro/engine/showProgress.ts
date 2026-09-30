import { addChat, currentStep, stepResolved } from './showState';
import { revealMs, TIMING, typingMs } from './timing';
import type { EffectRun, PlannedStep, ShowState } from './showTypes';

/** Typing time of a step and how many of its characters have been typed (applied) at `t`. */
export function stepTyping(state: ShowState, step: PlannedStep): { ms: number; typed: number } {
  const ms = typingMs(step.chars, step.fast, state.config.reducedMotion);
  const elapsed = state.t - state.stageAt;
  if (state.stage !== 'type') return { ms, typed: state.stage === 'settle' ? step.chars : 0 };
  if (state.config.reducedMotion) return { ms, typed: elapsed >= ms ? step.chars : 0 };
  return { ms, typed: Math.min(step.chars, Math.floor((elapsed / ms) * step.chars)) };
}

/** Where a hold at a safe point ends: the latest cap of the holds still on. */
export function holdEndsAt(state: ShowState, heldSince: number): number | null {
  const caps = [
    state.visitor.composing ? heldSince + TIMING.composingCapMs : null,
    state.visitor.request ? heldSince + TIMING.answeringCapMs : null,
  ].filter((cap): cap is number => cap !== null);
  return caps.length ? Math.max(...caps) : null;
}

/**
 * A safe point was reached at `ready`: hold while the visitor types or a reply streams (each up to
 * its cap), else go on at the time the hold ended (`ready` when there was none).
 */
function passSafePoint(state: ShowState, ready: number, next: (at: number) => ShowState) {
  const heldSince = state.heldSince ?? ready;
  const endsAt = holdEndsAt(state, heldSince);
  if (endsAt !== null && state.t < endsAt) {
    return state.heldSince === null ? { ...state, heldSince } : state;
  }
  const at = state.heldSince === null ? ready : (endsAt ?? state.t);
  return next(at);
}

function enterStep(state: ShowState, index: number, at: number): ShowState {
  const step = state.config.plan.steps[index];
  if (!step) return enterFinale(state, at);
  const moved = { ...state, phase: 'steps' as const, step: index, stage: 'narrate' as const };
  const text = state.narration[step.id] ?? step.fallback;
  return addChat({ ...moved, stageAt: at, heldSince: null }, { kind: 'agent', text, revealFrom: at, at });
}

function enterFinale(state: ShowState, at: number): ShowState {
  const text = state.narration.finale ?? state.config.plan.finaleFallback;
  const phaseEndsAt = at + revealMs(text, state.config.reducedMotion) + TIMING.closeDelayMs;
  const moved = { ...state, phase: 'finale' as const, phaseEndsAt, heldSince: null };
  return addChat(moved, { kind: 'agent', text, revealFrom: at, at });
}

/** Applies every effect whose text is typed; a module starts loading and resolves by event. */
function applyTyped(state: ShowState, step: PlannedStep, ms: number, typed: number): ShowState {
  let effects = state.effects;
  for (const effect of step.effects) {
    const run = effects[effect.key];
    if (!run || run.status !== 'pending' || effect.end > typed) continue;
    const reached = state.config.reducedMotion ? ms : Math.ceil((effect.end / step.chars) * ms);
    const at = state.stageAt + reached;
    const next: EffectRun =
      effect.effect.kind === 'loadModule' ? { status: 'running', at } : { status: 'applied', at };
    effects = { ...effects, [effect.key]: next };
  }
  for (const { key, effect } of step.effects) {
    const run = effects[key];
    if (effect.kind !== 'loadModule' || run?.status !== 'running') continue;
    if (state.t >= run.at + TIMING.moduleTimeoutMs) {
      const skipped: EffectRun = {
        status: 'skipped',
        at: run.at + TIMING.moduleTimeoutMs,
        reason: `${effect.module} didn't load in ${TIMING.moduleTimeoutMs / 1000} s`,
      };
      effects = { ...effects, [key]: skipped };
    }
  }
  return effects === state.effects ? state : { ...state, effects };
}

function typeStage(state: ShowState, step: PlannedStep): ShowState {
  const { ms, typed } = stepTyping(state, step);
  const applied = applyTyped(state, step, ms, typed);
  if (typed < step.chars || !stepResolved(applied, step)) return applied;
  const lastAt = Math.max(...step.effects.map(({ key }) => applied.effects[key]?.at ?? 0));
  return { ...applied, stage: 'settle', stageAt: Math.max(applied.stageAt + ms, lastAt) };
}

function stepsPhase(state: ShowState): ShowState {
  const step = currentStep(state);
  if (!step) return enterFinale(state, state.t);
  switch (state.stage) {
    case 'narrate': {
      const ready = state.stageAt + TIMING.narrateMs;
      if (state.t < ready) return state;
      return passSafePoint(state, ready, (at) => ({
        ...state,
        stage: 'type',
        stageAt: at,
        heldSince: null,
      }));
    }
    case 'type':
      return typeStage(state, step);
    case 'settle': {
      const ready = state.stageAt + TIMING.settleMs;
      if (state.t < ready) return state;
      return passSafePoint(state, ready, (at) => enterStep(state, state.step + 1, at));
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
    case 'steps':
      return stepsPhase(state);
    case 'finale':
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
