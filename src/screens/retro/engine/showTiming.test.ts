import { RETRO_SHOW } from '../scenario';
import { retroStrings } from '../strings';
import { currentPlannedChunk } from './showState';
import { ShowTestRun } from './showTestRun';
import { commentMs, TIMING, typingMs } from './timing';
import type { PlannedChunk, ShowState } from './showTypes';

// The chunk rhythm on the fake clock (docs/design/retro/SPEC.md → Chunk rhythm and timing budget).

const inChunk = (key: string) => (state: ShowState) =>
  state.stage === 'type' && currentPlannedChunk(state)?.key === key;
const planned = (run: ShowTestRun, key: string): PlannedChunk => {
  const chunk = run.state.config.plan.steps
    .flatMap((step) => step.chunks)
    .find((c) => c.key === key);
  if (!chunk) throw new Error(`No chunk ${key}`);
  return chunk;
};
const appliedAt = (run: ShowTestRun, key: string) => run.state.effects[key]?.at ?? NaN;

/** Starts a chunk and returns the show time it started typing. */
function startOf(run: ShowTestRun, key: string): number {
  run.advanceUntil(inChunk(key));
  return run.state.stageAt;
}

/**
 * Runs the whole show like the screen would: the camera settles at once (`focusSettled` as soon as
 * a chunk types) and the AI chat loads at once. Returns the show time at `done`.
 */
function runWithInstantCamera(run: ShowTestRun): number {
  for (let guard = 0; guard < 20_000 && run.state.phase !== 'done'; guard++) {
    const chunk = currentPlannedChunk(run.state);
    if (chunk && run.state.stage === 'type' && run.state.focusAt === null)
      run.dispatch({ type: 'focusSettled', key: chunk.key });
    if (run.status('module:ai-chat') === 'running')
      run.dispatch({ type: 'moduleLoaded', key: 'module:ai-chat' });
    run.advance(10);
  }
  return run.state.t;
}

describe('show timing: one chunk', () => {
  it('types each chunk at 100 chars/s, clamped to 0.6–1.3 s', () => {
    expect(typingMs(24, false)).toBe(TIMING.chunkMinMs);
    expect(typingMs(100, false)).toBe(1_000);
    expect(typingMs(1_000, false)).toBe(TIMING.chunkMaxMs);
    expect(typingMs(1_000, true)).toBe(TIMING.reducedMotionApplyMs);
  });

  it('types the narration comment at 100 chars/s (0.6–2 s), then waits 0.6 s for the first chunk', () => {
    expect(commentMs(30, false)).toBe(TIMING.chunkMinMs);
    expect(commentMs(110, false)).toBe(1_100);
    expect(commentMs(400, false)).toBe(TIMING.commentMaxMs);
    expect(commentMs(400, true)).toBe(0);

    const run = new ShowTestRun(RETRO_SHOW);
    run.advanceUntil((state) => state.phase === 'steps');
    const narrated = run.state.stageAt;
    const typed = commentMs(run.state.comment.join('').length, false);
    expect(startOf(run, 'layer:type-faces')).toBe(narrated + typed + TIMING.narrateMs);
  });

  it('applies a page-wide chunk at its last character: nothing to scroll to', () => {
    const run = new ShowTestRun(RETRO_SHOW);
    const start = startOf(run, 'layer:type-family');
    run.advanceUntil(() => run.status('layer:type-family') === 'applied');
    const ms = typingMs(planned(run, 'layer:type-family').chars, false);
    expect(ms).toBeLessThan(TIMING.focusSettleCapMs);
    expect(appliedAt(run, 'layer:type-family')).toBe(start + ms);
  });

  it('applies a targeted chunk once typed and the camera settled, at most 0.8 s after it started', () => {
    const key = 'decoration:oh-snap';
    const typed = (run: ShowTestRun) => typingMs(planned(run, key).chars, false);

    const alone = new ShowTestRun(RETRO_SHOW);
    const start = startOf(alone, key);
    expect(typed(alone)).toBeLessThan(TIMING.focusSettleCapMs);
    alone.dispatch({ type: 'focusSettled', key: 'layer:page-frame' });
    alone.advanceUntil(() => alone.status(key) === 'applied');
    expect(appliedAt(alone, key)).toBe(start + TIMING.focusSettleCapMs);

    const early = new ShowTestRun(RETRO_SHOW);
    const earlyStart = startOf(early, key);
    early.dispatch({ type: 'focusSettled', key });
    early.advanceUntil(() => early.status(key) === 'applied');
    expect(appliedAt(early, key)).toBe(earlyStart + typed(early));

    const late = new ShowTestRun(RETRO_SHOW);
    const lateStart = startOf(late, key);
    late.advance(lateStart + 600 - late.state.t);
    expect(late.status(key)).toBe('pending');
    late.dispatch({ type: 'focusSettled', key });
    expect(late.status(key)).toBe('applied');
    expect(appliedAt(late, key)).toBe(lateStart + 600);
  });

  it('beats 1 s after each apply, then 0.3 s after the last beat of a step', () => {
    const run = new ShowTestRun(RETRO_SHOW);
    run.advanceUntil((state) => state.stage === 'stepDone');
    const last = run.state.config.plan.steps[0]?.chunks.at(-1)?.key ?? '';
    expect(run.state.stageAt).toBe(appliedAt(run, last) + TIMING.beatMs);
    const stepDoneAt = run.state.stageAt;
    run.advanceUntil((state) => state.step === 1);
    expect(run.state.stageAt).toBe(stepDoneAt + TIMING.stepDoneMs);
  });
});

describe('show timing: the whole show', () => {
  it('runs in about 91 s with the real copy and a camera that settles at once (Round 5)', () => {
    const run = new ShowTestRun(RETRO_SHOW, { copy: retroStrings.en });
    const total = runWithInstantCamera(run);
    expect(total).toBeGreaterThan(85_000);
    expect(total).toBeLessThan(97_000);
  });

  it('never takes longer than the 0.8 s cap per chunk without a camera', () => {
    const withCamera = runWithInstantCamera(new ShowTestRun(RETRO_SHOW));
    const run = new ShowTestRun(RETRO_SHOW);
    run.advanceUntil(() => run.status('module:ai-chat') === 'running');
    run.dispatch({ type: 'moduleLoaded', key: 'module:ai-chat' });
    run.advanceUntil((state) => state.phase === 'done');
    expect(run.state.t).toBeGreaterThanOrEqual(withCamera);
    expect(run.state.t - withCamera).toBeLessThan(36 * TIMING.focusSettleCapMs);
  });
});
