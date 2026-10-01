import { RETRO_SHOW } from '../scenario';
import { currentChunk, highlightOf, leavingDecorations, targetQuery } from './chunkSelectors';
import { nextWakeMs } from './schedule';
import {
  activeDecorations,
  appliedTokens,
  consoleCounters,
  consoleRows,
  lastDoneStep,
} from './showSelectors';
import { currentPlannedChunk } from './showState';
import { ShowTestRun } from './showTestRun';
import { TIMING } from './timing';
import type { ShowState } from './showTypes';

const TEXTS = { opening: 'Agent connected.', end: 'the end' };
const rows = (state: ShowState) => consoleRows(state, TEXTS);
/** The rows as one string each: `kind text`. */
const brief = (state: ShowState) =>
  rows(state).map((row) => {
    switch (row.kind) {
      case 'group':
        return `group${row.collapsed ? ' ✓' : ''} ${row.title}`;
      case 'prompt':
      case 'echo':
        return `${row.kind} ${row.lines.join(' ⏎ ')}`.trimEnd();
      default:
        return `${row.kind} ${row.text}`;
    }
  });
const inChunk = (key: string, stage: 'type' | 'beat') => (state: ShowState) =>
  state.stage === stage && currentPlannedChunk(state)?.key === key;
const applied = (key: string) => (state: ShowState) => state.effects[key]?.status === 'applied';

describe('consoleRows (DevTools console)', () => {
  it('opens with the log line and an empty prompt before the first step', () => {
    const run = new ShowTestRun(RETRO_SHOW);
    run.advanceUntil((state) => state.phase === 'console');
    expect(brief(run.state)).toEqual(['log Agent connected.', 'prompt']);
  });

  it('runs each chunk: the prompt types it, then echo, `<· undefined`, its ✓ and an empty prompt', () => {
    const run = new ShowTestRun(RETRO_SHOW);
    run.advanceUntil(inChunk('layer:type-faces', 'type'));
    run.advance(100);
    const typing = rows(run.state).at(-1);
    expect(typing?.kind).toBe('prompt');
    expect(typing?.kind === 'prompt' && typing.lines.join('')).toMatch(/^\/\/ → he/);

    run.advanceUntil(applied('layer:type-faces'));
    expect(brief(run.state)).toEqual([
      'log Agent connected.',
      'group 1/8 fonts',
      `echo // → headings ⏎ document.querySelector('style[data-retro-layer="type-faces"]').remove()`,
      'result undefined',
      'done type-faces removed',
      'prompt',
    ]);
  });

  it('collapses a finished step to ✓ n/N when the next one starts', () => {
    const run = new ShowTestRun(RETRO_SHOW);
    run.advanceUntil((state) => state.stage === 'stepDone');
    expect(brief(run.state).filter((row) => row.startsWith('done'))).toHaveLength(6);
    expect(brief(run.state).at(-1)).toBe('prompt');
    run.advanceUntil((state) => state.step === 1);
    expect(brief(run.state)).toEqual(['log Agent connected.', 'group ✓ 1/8 fonts', 'prompt']);
    run.advanceUntil((state) => state.stage === 'type');
    expect(brief(run.state).slice(0, 3)).toEqual([
      'log Agent connected.',
      'group ✓ 1/8 fonts',
      'group 2/8 colours',
    ]);
  });

  it('shows a chunk at once with reduced motion', () => {
    const run = new ShowTestRun(RETRO_SHOW, { reducedMotion: true });
    run.advanceUntil(inChunk('layer:type-faces', 'type'));
    expect(rows(run.state).at(-1)).toEqual({
      kind: 'prompt',
      lines: currentPlannedChunk(run.state)?.input,
    });
  });

  it('ends with every group collapsed, the end line and an empty prompt', () => {
    const run = new ShowTestRun(RETRO_SHOW, { reducedMotion: true });
    run.advanceUntil((state) => state.phase === 'finale');
    expect(brief(run.state)).toEqual([
      'log Agent connected.',
      ...RETRO_SHOW.meta.map(({ title }, index) => `group ✓ ${index + 1}/8 ${title}`),
      'end the end',
      'prompt',
    ]);
  });

  it('shows an awaited import as its echo, and a skipped chunk as a warning', () => {
    const run = new ShowTestRun(RETRO_SHOW, { reducedMotion: true });
    run.advanceUntil((state) => state.effects['module:ai-chat']?.status === 'running');
    expect(brief(run.state).at(-1)).toBe("echo const { ChatRoute } = await import('./chat')");
    run.dispatch({ type: 'effectFailed', key: 'module:ai-chat', reason: 'failed to load' });
    expect(brief(run.state).slice(-2)).toEqual(['warn ai-chat skipped: failed to load', 'prompt']);
  });
});

describe('consoleCounters', () => {
  it('counts chunks (✖) and steps (⚠) not done yet, down to 0 at the end', () => {
    const run = new ShowTestRun(RETRO_SHOW, { reducedMotion: true });
    expect(consoleCounters(run.state)).toEqual({ errors: 36, warnings: 8 });
    run.advanceUntil(applied('layer:type-faces'));
    expect(consoleCounters(run.state)).toEqual({ errors: 35, warnings: 8 });
    run.advanceUntil((state) => state.step === 1);
    expect(consoleCounters(run.state)).toEqual({ errors: 30, warnings: 7 });
    run.advanceUntil((state) => state.phase === 'done');
    expect(consoleCounters(run.state)).toEqual({ errors: 0, warnings: 0 });
  });
});

describe('appliedTokens', () => {
  it("keeps the applied token chunks' values until the show is done", () => {
    const run = new ShowTestRun(RETRO_SHOW, { reducedMotion: true }, () => 'today');
    expect(appliedTokens(run.state)).toEqual([]);
    run.advanceUntil(applied('layer:type-family'));
    const family = currentPlannedChunk(run.state);
    expect(appliedTokens(run.state)).toEqual(family?.tokens);
    expect(family?.tokens.length).toBeGreaterThan(0);
    run.advanceUntil((state) => state.phase === 'done');
    expect(appliedTokens(run.state)).toEqual([]);
  });
});

describe('lastDoneStep', () => {
  it('names the last finished step for the live announcement', () => {
    const run = new ShowTestRun(RETRO_SHOW);
    expect(lastDoneStep(run.state)).toBeNull();
    run.advanceUntil((state) => state.step === 1);
    expect(lastDoneStep(run.state)).toEqual({ number: 1, title: 'fonts' });
  });
});

describe('chunk selectors (for the stage)', () => {
  it('follows the current chunk from typing through its beat', () => {
    const run = new ShowTestRun(RETRO_SHOW);
    run.advanceUntil((state) => state.phase === 'steps');
    expect(currentChunk(run.state)).toBeNull();
    run.advanceUntil(inChunk('layer:type-faces', 'type'));
    expect(currentChunk(run.state)).toMatchObject({
      key: 'layer:type-faces',
      motion: 'morph',
      status: 'typing',
      appliedAt: null,
    });
    run.advanceUntil(inChunk('layer:type-faces', 'beat'));
    expect(currentChunk(run.state)).toMatchObject({
      status: 'applied',
      appliedAt: run.state.effects['layer:type-faces']?.at,
    });
  });

  it('highlights the target while it types, flashes at the apply, fades until the beat ends', () => {
    const run = new ShowTestRun(RETRO_SHOW);
    run.advanceUntil(inChunk('layer:type-faces', 'type'));
    expect(highlightOf(run.state)).toEqual({
      key: 'layer:type-faces',
      phase: 'typing',
      page: false,
      queries: ["[data-retro-stage] [data-testid='cv-name']", '[data-retro-stage] h2'],
    });
    run.advanceUntil(applied('layer:type-faces'));
    const at = run.state.effects['layer:type-faces']?.at ?? NaN;
    run.advance(at + TIMING.highlightHoldMs - 1 - run.state.t);
    expect(highlightOf(run.state)?.phase).toBe('applied');
    run.advance(1);
    expect(highlightOf(run.state)?.phase).toBe('fading');
    run.advanceUntil(inChunk('layer:type-family', 'type'));
    expect(highlightOf(run.state)).toMatchObject({ page: true, queries: [], phase: 'typing' });
  });

  it('marks nothing for the module chunk', () => {
    const run = new ShowTestRun(RETRO_SHOW);
    run.advanceUntil(inChunk('module:ai-chat', 'type'));
    expect(currentChunk(run.state)).toMatchObject({ target: null, motion: 'none' });
    expect(highlightOf(run.state)).toBeNull();
  });

  it('keeps a removed decoration leaving for 250 ms, and wakes the screen when it goes', () => {
    const run = new ShowTestRun(RETRO_SHOW);
    run.advanceUntil(applied('decoration:oh-snap'));
    const at = run.state.effects['decoration:oh-snap']?.at ?? NaN;
    expect(activeDecorations(run.state)).not.toContain('oh-snap');
    expect(leavingDecorations(run.state)).toEqual(['oh-snap']);
    expect(nextWakeMs(run.state)).toBe(at + TIMING.highlightHoldMs - run.state.t);
    run.advance(at + TIMING.highlightHoldMs - run.state.t);
    expect(nextWakeMs(run.state)).toBe(TIMING.leaveMs - TIMING.highlightHoldMs);
    run.advance(TIMING.leaveMs - TIMING.highlightHoldMs);
    expect(leavingDecorations(run.state)).toEqual([]);

    const still = new ShowTestRun(RETRO_SHOW, { reducedMotion: true });
    still.advanceUntil(applied('decoration:oh-snap'));
    expect(leavingDecorations(still.state)).toEqual([]);
  });

  it('resolves targets under the stage, decorations by their id', () => {
    expect(targetQuery('h2')).toBe('[data-retro-stage] h2');
    expect(targetQuery('#top-bar')).toBe('#top-bar');
  });
});
