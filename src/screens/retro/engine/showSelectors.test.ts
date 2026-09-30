import { RETRO_SHOW } from '../scenario';
import { currentChunk, highlightOf, leavingDecorations, targetQuery } from './chunkSelectors';
import { nextWakeMs } from './schedule';
import { activeDecorations, consoleView, progressOf } from './showSelectors';
import { currentPlannedChunk } from './showState';
import { ShowTestRun } from './showTestRun';
import { TIMING } from './timing';
import type { ShowState } from './showTypes';

const TEXTS = { prompt: '$ fix', end: 'the end' };
const texts = (state: ShowState) => consoleView(state, TEXTS).lines.map(({ text }) => text);
const inChunk = (key: string, stage: 'type' | 'beat') => (state: ShowState) =>
  state.stage === stage && currentPlannedChunk(state)?.key === key;
const applied = (key: string) => (state: ShowState) => state.effects[key]?.status === 'applied';

describe('consoleView', () => {
  it("prints each started chunk's target line, code and ✓, and the current one as typed", () => {
    const run = new ShowTestRun(RETRO_SHOW);
    run.advanceUntil(inChunk('layer:type-scale-headings', 'type'));
    run.advance(100);
    const { lines, typing } = consoleView(run.state, TEXTS);
    expect(typing).toBe(true);
    expect(lines[0]).toEqual({ kind: 'prompt', text: '$ fix' });
    expect(lines[1]).toEqual({ kind: 'comment', text: '// 1/8 fonts' });
    const printed = lines.map(({ text }) => text);
    expect(printed.filter((text) => text.startsWith('// → '))).toEqual([
      '// → headings',
      '// → page',
      '// → name & titles',
    ]);
    expect(printed.filter((text) => text.startsWith('✓'))).toEqual([
      '✓ type-faces removed',
      '✓ type-family removed',
    ]);
    expect(printed.at(-1)?.length).toBeGreaterThan(0);
  });

  it('collapses finished steps to their ✓ line and ends each step with it', () => {
    const run = new ShowTestRun(RETRO_SHOW);
    run.advanceUntil((state) => state.stage === 'stepDone');
    expect(texts(run.state).at(-1)).toBe('✓ 1/8 fonts');
    run.advanceUntil((state) => state.step === 1);
    expect(texts(run.state)).toEqual(['$ fix', '✓ 1/8 fonts', '// 2/8 colours']);
  });

  it('shows a chunk at once with reduced motion, with no caret', () => {
    const run = new ShowTestRun(RETRO_SHOW, { reducedMotion: true });
    run.advanceUntil(inChunk('layer:type-faces', 'type'));
    const { lines, typing } = consoleView(run.state, TEXTS);
    expect(typing).toBe(false);
    const css = RETRO_SHOW.layers['type-faces']?.css.trimEnd().split('\n').at(-1);
    expect(lines.at(-1)?.text).toBe(css);
  });
});

describe('progressOf', () => {
  it("counts the current step's resolved chunks", () => {
    const run = new ShowTestRun(RETRO_SHOW);
    run.advanceUntil(applied('layer:type-scale-headings'));
    expect(progressOf(run.state)).toMatchObject({
      step: { number: 1, title: 'fonts' },
      total: 8,
      percent: Math.round((3 / 6 / 8) * 100),
      lastDone: null,
    });
    run.advanceUntil((state) => state.step === 1);
    expect(progressOf(run.state)).toMatchObject({
      step: { number: 2, title: 'colours' },
      percent: Math.round((1 / 8) * 100),
      lastDone: { number: 1, title: 'fonts' },
    });
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
