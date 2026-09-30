import { chunkTyping } from './showProgress';
import { chunkResolved, currentPlannedChunk, currentStep, showEnded, stepsDone } from './showState';
import { TIMING } from './timing';
import type { ConsoleLine, PlannedChunk, PlannedStep, ShowState } from './showTypes';

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
    step.chunks.flatMap(({ key, effect }) =>
      effect.kind === 'loadModule' && state.effects[key]?.status === 'running'
        ? [{ key, module: effect.module }]
        : [],
    ),
  );
}

/** A started chunk's lines as far as they show, then its `✓` (or `// skipped`) once resolved. */
function chunkLines(state: ShowState, chunk: PlannedChunk, shown: number): ConsoleLine[] {
  const lines: ConsoleLine[] = [];
  let offset = 0;
  for (const line of chunk.lines) {
    if (offset >= shown) return lines;
    lines.push({ ...line, text: line.text.slice(0, shown - offset) });
    offset += line.text.length;
  }
  const run = state.effects[chunk.key];
  if (run?.status === 'applied') lines.push({ kind: 'effectDone', text: `✓ ${chunk.doneText}` });
  if (run?.status === 'skipped') lines.push({ kind: 'skipped', text: `// skipped: ${run.reason}` });
  return lines;
}

/** Characters of the current chunk's code on screen (with reduced motion: all of it at once). */
function shownChars(state: ShowState, chunk: PlannedChunk): number {
  return state.stage === 'type' ? chunkTyping(state, chunk).shown : chunk.chars;
}

function stepLines(state: ShowState, step: PlannedStep, name: string): ConsoleLine[] {
  const lines: ConsoleLine[] = [{ kind: 'comment', text: `// ${name}` }];
  if (state.stage === 'narrate') return lines;
  const started = state.stage === 'stepDone' ? step.chunks.length : state.chunk + 1;
  step.chunks.slice(0, started).forEach((chunk, index) => {
    const shown = index === state.chunk ? shownChars(state, chunk) : chunk.chars;
    lines.push(...chunkLines(state, chunk, shown));
  });
  if (state.stage === 'stepDone') lines.push({ kind: 'stepDone', text: `✓ ${name}` });
  return lines;
}

/**
 * The console as it reads now: the prompt, one `✓` line per finished step, the current step's
 * chunks typed so far (each chunk's `✓` under its code once applied), and the end lines.
 */
export function consoleView(
  state: ShowState,
  texts: { prompt: string; end: string },
): { lines: ConsoleLine[]; typing: boolean } {
  const { steps } = state.config.plan;
  const name = (index: number) => `${index + 1}/${steps.length} ${steps[index]?.title ?? ''}`;
  const ended = showEnded(state);
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
  const chunk = currentPlannedChunk(state);
  const typing = !!chunk && state.stage === 'type' && shownChars(state, chunk) < chunk.chars;
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

/** Progress: (finished steps + share of the current step's chunks resolved) / N (SPEC). */
export function progressOf(state: ShowState): ShowProgress {
  const { steps } = state.config.plan;
  const total = steps.length;
  const done = stepsDone(state);
  const step = currentStep(state);
  const resolved = step?.chunks.filter(({ key }) => chunkResolved(state, key)).length ?? 0;
  const share = step ? resolved / step.chunks.length : 0;
  const finishedAll = showEnded(state);
  const shown = Math.min(total - 1, step && share === 1 ? state.step + 1 : state.step);
  const named = (index: number) => ({ number: index + 1, title: steps[index]?.title ?? '' });
  return {
    step: finishedAll ? null : named(Math.max(0, shown)),
    total,
    percent: finishedAll ? 100 : Math.round(((state.step + share) / total) * 100),
    lastDone: done > 0 ? named(done - 1) : null,
  };
}

/** A chat entry's text as far as it has revealed (scripted lines type at 40 chars/s). */
export function revealedText(state: ShowState, text: string, revealFrom: number | null): string {
  if (revealFrom === null || state.config.reducedMotion) return text;
  const chars = Math.floor(((state.t - revealFrom) / 1000) * TIMING.chatCharsPerSecond);
  return text.slice(0, Math.max(0, chars));
}
