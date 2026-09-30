import { stepTyping } from './showProgress';
import { currentStep, stepResolved, stepsDone } from './showState';
import { TIMING } from './timing';
import type { ConsoleLine, PlannedStep, ShowState } from './showTypes';

const removedBy = (state: ShowState, key: string) =>
  state.phase === 'done' || state.effects[key]?.status === 'applied';

/** Damage layers still on the page, in scenario order; none once the show is done. */
export function activeLayers(state: ShowState): string[] {
  return state.config.plan.layers.filter((id) => !removedBy(state, `layer:${id}`));
}

/** Decorations still on the page; none once the show is done. */
export function activeDecorations(state: ShowState): string[] {
  return state.config.plan.decorations.filter((id) => !removedBy(state, `decoration:${id}`));
}

/** Modules whose `import()` should be running now. */
export function runningModules(state: ShowState): { key: string; module: string }[] {
  return state.config.plan.steps.flatMap((step) =>
    step.effects.flatMap(({ key, effect }) =>
      effect.kind === 'loadModule' && state.effects[key]?.status === 'running'
        ? [{ key, module: effect.module }]
        : [],
    ),
  );
}

/** Characters of the current step's code on screen (with reduced motion: all of it at once). */
function shownChars(state: ShowState, step: PlannedStep): number {
  if (state.stage === 'narrate') return 0;
  if (state.config.reducedMotion || state.stage === 'settle') return step.chars;
  return stepTyping(state, step).typed;
}

function stepLines(state: ShowState, step: PlannedStep, name: string): ConsoleLine[] {
  const lines: ConsoleLine[] = [{ kind: 'comment', text: `// ${name}` }];
  const shown = shownChars(state, step);
  let offset = 0;
  for (const effect of step.effects) {
    for (const line of effect.lines) {
      if (offset >= shown) return lines;
      lines.push({ ...line, text: line.text.slice(0, shown - offset) });
      offset += line.text.length;
    }
    const run = state.effects[effect.key];
    if (run?.status === 'applied') lines.push({ kind: 'effectDone', text: `✓ ${effect.doneText}` });
    if (run?.status === 'skipped')
      lines.push({ kind: 'skipped', text: `// skipped: ${run.reason}` });
  }
  if (state.stage === 'settle') lines.push({ kind: 'stepDone', text: `✓ ${name}` });
  return lines;
}

/**
 * The console as it reads now: the prompt, one `✓` line per finished step, the current step's
 * code typed so far (each effect's `✓` under its code once applied), and the end lines.
 */
export function consoleView(
  state: ShowState,
  texts: { prompt: string; end: string },
): { lines: ConsoleLine[]; typing: boolean } {
  const { steps } = state.config.plan;
  const name = (index: number) => `${index + 1}/${steps.length} ${steps[index]?.title ?? ''}`;
  const ended = state.phase === 'finale' || state.phase === 'done';
  const finished = ended ? steps.length : state.phase === 'steps' ? state.step : 0;
  const lines: ConsoleLine[] = [
    { kind: 'prompt', text: texts.prompt },
    ...steps
      .slice(0, finished)
      .map((_, i): ConsoleLine => ({ kind: 'stepDone', text: `✓ ${name(i)}` })),
  ];
  const step = currentStep(state);
  if (step) lines.push(...stepLines(state, step, name(state.step)));
  if (ended) lines.push({ kind: 'prompt', text: '$' }, { kind: 'end', text: texts.end });
  const typing = !!step && state.stage === 'type' && shownChars(state, step) < step.chars;
  return { lines, typing };
}

export interface ShowProgress {
  /** 1-based step the progress row names, or `null` when all fixes are applied. */
  step: { number: number; title: string } | null;
  total: number;
  percent: number;
  /** The last finished step, for the screen reader line. */
  lastDone: { number: number; title: string } | null;
}

/** Progress: (finished steps + share of the current step's effects applied) / N (SPEC). */
export function progressOf(state: ShowState): ShowProgress {
  const { steps } = state.config.plan;
  const total = steps.length;
  const done = stepsDone(state);
  const step = currentStep(state);
  const resolvedEffects = step?.effects.filter(({ key }) => {
    const status = state.effects[key]?.status;
    return status === 'applied' || status === 'skipped';
  });
  const resolved = step && resolvedEffects ? resolvedEffects.length / step.effects.length : 0;
  const finishedAll = state.phase === 'finale' || state.phase === 'done';
  const shown = Math.min(
    total - 1,
    step && stepResolved(state, step) ? state.step + 1 : state.step,
  );
  const named = (index: number) => ({ number: index + 1, title: steps[index]?.title ?? '' });
  return {
    step: finishedAll ? null : named(Math.max(0, shown)),
    total,
    percent: finishedAll ? 100 : Math.round(((state.step + resolved) / total) * 100),
    lastDone: done > 0 ? named(done - 1) : null,
  };
}

/** A chat entry's text as far as it has revealed (scripted lines type at 40 chars/s). */
export function revealedText(state: ShowState, text: string, revealFrom: number | null): string {
  if (revealFrom === null || state.config.reducedMotion) return text;
  const chars = Math.floor(((state.t - revealFrom) / 1000) * TIMING.chatCharsPerSecond);
  return text.slice(0, Math.max(0, chars));
}
