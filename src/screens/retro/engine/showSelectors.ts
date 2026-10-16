import { chunkTyping, commentTyping } from './showProgress';
import { effectId } from './consolePlan';
import { chunkResolved, currentStep, showEnded, stepsDone } from './showState';
import { TIMING } from './timing';
import type { ConsoleRow, PlannedChunk, ShowState, TokenValue } from './showTypes';

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

/** Custom properties the applied token chunks have set inline; none once the show is done. */
export function appliedTokens(state: ShowState): TokenValue[] {
  if (state.phase === 'done') return [];
  return state.config.plan.steps.flatMap((step) =>
    step.chunks.flatMap(({ key, tokens }) =>
      state.effects[key]?.status === 'applied' ? tokens : [],
    ),
  );
}

const EMPTY_PROMPT: ConsoleRow = { kind: 'prompt', lines: [] };

/** The first `shown` characters of an input, by line (lines not reached yet are left out). */
function typedLines(input: readonly string[], shown: number): string[] {
  const lines: string[] = [];
  let offset = 0;
  for (const line of input) {
    if (offset >= shown) break;
    lines.push(line.slice(0, shown - offset));
    offset += line.length;
  }
  return lines;
}

/**
 * A started chunk's rows: the prompt typing its input; once run, the echo, then `<· undefined` and
 * its `✓` line (or the warning it was skipped with). A module waiting for its `import()` shows only
 * the echo, as an awaited input does. The step's first chunk types on under the narration comment,
 * in the same input (`comment`; empty for the others).
 */
function chunkRows(
  state: ShowState,
  chunk: PlannedChunk,
  comment: readonly string[],
): ConsoleRow[] {
  const run = state.effects[chunk.key];
  const echo: ConsoleRow = { kind: 'echo', lines: [...comment, ...chunk.input] };
  switch (run?.status) {
    case 'applied':
      return [echo, { kind: 'result', text: 'undefined' }, { kind: 'done', text: chunk.doneText }];
    case 'skipped':
      return [echo, { kind: 'warn', text: `${effectId(chunk.effect)} skipped: ${run.reason}` }];
    case 'running':
      return [echo];
    default: {
      const shown = state.stage === 'type' ? chunkTyping(state, chunk).shown : chunk.chars;
      return [{ kind: 'prompt', lines: [...comment, ...typedLines(chunk.input, shown)] }];
    }
  }
}

/** Groups collapsed to `✓ n/N <title>`: the steps before the current one, all once the show ended. */
function collapsedSteps(state: ShowState): number {
  if (showEnded(state)) return state.config.plan.steps.length;
  return state.phase === 'steps' ? state.step : 0;
}

const stepTitle = (state: ShowState, index: number) => {
  const { steps } = state.config.plan;
  return `${index + 1}/${steps.length} ${steps[index]?.title ?? ''}`;
};

/**
 * The DevTools console as it reads now (SPEC → DevTools console → Messages): the opening line, one
 * collapsed group per finished step, the current step's open group (its narration comment typing,
 * then its chunks so far), and at the end `✓ All fixes applied.`; an empty prompt after every run.
 */
export function consoleRows(
  state: ShowState,
  texts: { opening: string; end: string },
): ConsoleRow[] {
  const rows: ConsoleRow[] = [{ kind: 'log', text: texts.opening }];
  for (let index = 0; index < collapsedSteps(state); index++) {
    rows.push({ kind: 'group', title: stepTitle(state, index), collapsed: true });
  }
  const step = currentStep(state);
  if (!step) {
    if (showEnded(state)) rows.push({ kind: 'end', text: texts.end });
    return [...rows, EMPTY_PROMPT];
  }
  rows.push({ kind: 'group', title: stepTitle(state, state.step), collapsed: false });
  if (state.stage === 'narrate') {
    return [
      ...rows,
      { kind: 'prompt', lines: typedLines(state.comment, commentTyping(state).shown) },
    ];
  }
  const started = state.stage === 'stepDone' ? step.chunks.length : state.chunk + 1;
  const chunks = step.chunks.slice(0, started);
  chunks.forEach((chunk, index) =>
    rows.push(...chunkRows(state, chunk, index ? [] : state.comment)),
  );
  const last = chunks.at(-1);
  return last && chunkResolved(state, last.key) ? [...rows, EMPTY_PROMPT] : rows;
}

/** The toolbar's counters (SPEC Decision 27): ✖ chunks not done yet, ⚠ steps not done yet. */
export function consoleCounters(state: ShowState): { errors: number; warnings: number } {
  const { steps } = state.config.plan;
  const chunks = steps.flatMap((step) => step.chunks);
  const errors = showEnded(state)
    ? 0
    : chunks.filter(({ key }) => !chunkResolved(state, key)).length;
  return { errors, warnings: steps.length - collapsedSteps(state) };
}

/** The last finished step, for the console's visually hidden live line. */
export function lastDoneStep(state: ShowState): { number: number; title: string } | null {
  const done = stepsDone(state);
  const step = state.config.plan.steps[done - 1];
  return step ? { number: done, title: step.title } : null;
}

/** A chat entry's text as far as it has revealed (scripted lines type at 40 chars/s). */
export function revealedText(state: ShowState, text: string, revealFrom: number | null): string {
  if (revealFrom === null || state.config.reducedMotion) return text;
  const chars = Math.floor(((state.t - revealFrom) / 1000) * TIMING.chatCharsPerSecond);
  return text.slice(0, Math.max(0, chars));
}
