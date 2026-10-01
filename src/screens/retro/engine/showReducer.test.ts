import { RETRO_FINALE_FALLBACK, RETRO_STEP_IDS, RETRO_STEPS } from '../../../data/retro';
import { RETRO_SHOW } from '../scenario';
import { canSend, MAX_VISITOR_MESSAGES } from './showReducer';
import { ShowTestRun, TEST_COPY } from './showTestRun';
import { TIMING } from './timing';
import type { ShowState } from './showTypes';

const agentLines = (state: ShowState) =>
  state.chat.filter(({ kind }) => kind === 'agent').map(({ text }) => text);
const inStep = (id: string, stage?: string) => (state: ShowState) =>
  state.phase === 'steps' &&
  state.config.plan.steps[state.step]?.id === id &&
  (!stage || state.stage === stage);
const inChunk = (key: string, stage: 'type' | 'beat') => (state: ShowState) =>
  state.phase === 'steps' &&
  state.stage === stage &&
  state.config.plan.steps[state.step]?.chunks[state.chunk]?.key === key;
const appliedAt = (run: ShowTestRun, key: string) => run.state.effects[key]?.at ?? NaN;

describe('showReducer: timeline', () => {
  it('opens the chat after 3 s, then the console, then runs every step, closes and ends', () => {
    const run = new ShowTestRun(RETRO_SHOW);
    run.advance(TIMING.chatDelayMs - 1);
    expect(run.state.phase).toBe('idle');
    expect(run.state.chat).toEqual([]);

    run.advance(1);
    expect(run.state.phase).toBe('chat');
    expect(run.state.chat.map(({ text }) => text)).toEqual([
      TEST_COPY.systemJoin,
      TEST_COPY.systemJoined,
      TEST_COPY.greeting,
    ]);

    run.advanceUntil((state) => state.phase === 'console');
    expect(agentLines(run.state).at(-1)).toBe(TEST_COPY.handoff);

    const steps: string[] = [];
    run.advanceUntil((state) => {
      const id = state.config.plan.steps[state.step]?.id;
      if (state.phase === 'steps' && id && steps.at(-1) !== id) steps.push(id);
      return run.status('module:ai-chat') === 'running';
    });
    expect(steps).toEqual([...RETRO_STEP_IDS]);
    expect(agentLines(run.state)).toEqual([
      TEST_COPY.greeting,
      TEST_COPY.handoff,
      ...RETRO_STEPS.map(({ fallback }) => fallback),
    ]);
    run.dispatch({ type: 'moduleLoaded', key: 'module:ai-chat' });
    run.advanceUntil((state) => state.phase === 'finale');
    expect(agentLines(run.state).at(-1)).toBe(RETRO_FINALE_FALLBACK);
    expect(Object.values(run.state.effects).every(({ status }) => status === 'applied')).toBe(true);

    const finaleAt = run.state.t;
    run.advanceUntil((state) => state.phase === 'closing');
    expect(run.state.t - finaleAt).toBeGreaterThanOrEqual(TIMING.closeDelayMs);
    expect(canSend(run.state)).toBe(false);
    const closingAt = run.state.t;
    run.advanceUntil((state) => state.phase === 'done');
    expect(run.state.t - closingAt).toBe(TIMING.closingMs);
  });

  it('applies one chunk at a time: the next one waits for the beat', () => {
    const run = new ShowTestRun(RETRO_SHOW);
    run.advanceUntil(inChunk('layer:type-faces', 'type'));
    run.advanceUntil(() => run.status('layer:type-faces') === 'applied', 10_000);
    expect(run.status('layer:type-family')).toBe('pending');
    expect(run.state.stage).toBe('beat');
    run.advance(TIMING.beatMs - 20);
    expect(run.status('layer:type-family')).toBe('pending');
    expect(inChunk('layer:type-faces', 'beat')(run.state)).toBe(true);
    run.advanceUntil(inChunk('layer:type-family', 'type'));
    expect(run.state.stageAt).toBe(appliedAt(run, 'layer:type-faces') + TIMING.beatMs);
  });

  it('shows the LLM line for a step when it arrived, and the fallback otherwise', () => {
    const run = new ShowTestRun(RETRO_SHOW, { llm: true });
    run.dispatch({ type: 'narrationLine', key: 'colours', text: 'LLM says: colours.' });
    run.dispatch({ type: 'narrationLine', key: 'colours', text: 'A second line is ignored.' });
    run.advanceUntil(inStep('fonts'));
    expect(agentLines(run.state).at(-1)).toBe(RETRO_STEPS[0]?.fallback);
    run.advanceUntil(inStep('colours'));
    expect(agentLines(run.state).at(-1)).toBe('LLM says: colours.');
  });

  it('with reduced motion shows a chunk at once, applies it 0.6 s later and closes at once', () => {
    const run = new ShowTestRun(RETRO_SHOW, { reducedMotion: true });
    run.advanceUntil(inChunk('layer:type-family', 'type'));
    const start = run.state.stageAt;
    run.advanceUntil(() => run.status('layer:type-family') === 'applied');
    expect(appliedAt(run, 'layer:type-family')).toBe(start + TIMING.reducedMotionApplyMs);

    run.advanceUntil(() => run.status('module:ai-chat') === 'running');
    run.dispatch({ type: 'moduleLoaded', key: 'module:ai-chat' });
    run.advanceUntil((state) => state.phase === 'closing');
    run.advance(1);
    expect(run.state.phase).toBe('done');
  });
});

describe('showReducer: holds', () => {
  it('freezes everything while the tab is hidden and resumes where it stopped', () => {
    const run = new ShowTestRun(RETRO_SHOW);
    run.advance(2_000).dispatch({ type: 'visibility', hidden: true });
    run.advance(60_000);
    expect(run.state.phase).toBe('idle');
    expect(run.state.t).toBe(2_000);
    run.dispatch({ type: 'visibility', hidden: false }).advance(1_000);
    expect(run.state.phase).toBe('chat');
  });

  it("holds before a step's first chunk while the visitor composes, up to 15 s", () => {
    const run = new ShowTestRun(RETRO_SHOW);
    run.advanceUntil(inStep('fonts', 'narrate'));
    run.dispatch({ type: 'composing', on: true });
    run.advance(TIMING.narrateMs + 5_000);
    expect(run.state.stage).toBe('narrate');
    run.dispatch({ type: 'composing', on: false });
    expect(run.state.stage).toBe('type');

    run.advanceUntil(inStep('colours', 'narrate'));
    run.dispatch({ type: 'composing', on: true });
    const ready = run.state.stageAt + TIMING.narrateMs;
    run.advance(ready + TIMING.composingCapMs - 1 - run.state.t);
    expect(run.state.stage).toBe('narrate');
    run.advance(1);
    expect(run.state.stage).toBe('type');
    expect(run.state.stageAt).toBe(ready + TIMING.composingCapMs);
  });

  it('never holds mid-chunk: a chunk that started finishes as shown, then the next one waits', () => {
    const run = new ShowTestRun(RETRO_SHOW);
    run.advanceUntil(inChunk('layer:type-faces', 'type'));
    run.dispatch({ type: 'composing', on: true });
    run.advanceUntil(() => run.status('layer:type-faces') === 'applied', 5_000);
    const beatEnd = appliedAt(run, 'layer:type-faces') + TIMING.beatMs;
    run.advance(TIMING.beatMs + 5_000);
    expect(inChunk('layer:type-faces', 'beat')(run.state)).toBe(true);
    expect(run.state.heldSince).toBe(beatEnd);
    run.dispatch({ type: 'composing', on: false });
    expect(inChunk('layer:type-family', 'type')(run.state)).toBe(true);
    expect(run.state.stageAt).toBe(run.state.t);
  });

  it('holds the next chunk while a reply streams, up to 12 s', () => {
    const run = new ShowTestRun(RETRO_SHOW, { llm: true });
    run.advanceUntil(inChunk('layer:type-faces', 'beat'));
    run.dispatch({ type: 'visitorSent', text: 'nice' });
    expect(run.state.visitor.request).not.toBeNull();
    const beatEnd = run.state.stageAt + TIMING.beatMs;
    run.advance(beatEnd + TIMING.answeringCapMs - 10 - run.state.t);
    expect(inChunk('layer:type-faces', 'beat')(run.state)).toBe(true);
    run.advance(10);
    expect(inChunk('layer:type-family', 'type')(run.state)).toBe(true);
  });

  it('holds before the next step too, after its `✓ n/8` line', () => {
    const run = new ShowTestRun(RETRO_SHOW);
    run.advanceUntil(inStep('fonts', 'stepDone'));
    run.dispatch({ type: 'composing', on: true });
    run.advance(TIMING.stepDoneMs + 1_000);
    expect(inStep('fonts', 'stepDone')(run.state)).toBe(true);
    run.dispatch({ type: 'composing', on: false });
    expect(inStep('colours', 'narrate')(run.state)).toBe(true);
  });
});

describe('showReducer: failures never block', () => {
  it('skips a module that fails and still reaches done', () => {
    const run = new ShowTestRun(RETRO_SHOW);
    run.advanceUntil(() => run.status('module:ai-chat') === 'running');
    run.dispatch({ type: 'effectFailed', key: 'module:ai-chat', reason: 'network error' });
    expect(run.state.effects['module:ai-chat']).toMatchObject({
      status: 'skipped',
      reason: 'network error',
    });
    run.advanceUntil((state) => state.phase === 'done');
    expect(run.state.phase).toBe('done');
  });

  it('skips a module that does not load in 5 s', () => {
    const run = new ShowTestRun(RETRO_SHOW);
    run.advanceUntil(() => run.status('module:ai-chat') === 'running');
    run.advance(TIMING.moduleTimeoutMs);
    expect(run.state.effects['module:ai-chat']).toMatchObject({
      status: 'skipped',
      reason: 'not loaded after 5 s',
    });
    run.dispatch({ type: 'moduleLoaded', key: 'module:ai-chat' });
    expect(run.status('module:ai-chat')).toBe('skipped');
    run.advanceUntil((state) => state.phase === 'done');
    expect(run.state.phase).toBe('done');
  });
});

describe('showReducer: the visitor', () => {
  const chatOpen = (run: ShowTestRun) => run.advanceUntil((state) => state.phase === 'chat');

  it('answers with the scripted reply when the LLM is off', () => {
    const run = new ShowTestRun(RETRO_SHOW, { llm: false });
    chatOpen(run);
    run.dispatch({ type: 'visitorSent', text: '  wow, a marquee!  ' });
    expect(run.state.visitor.request).toBeNull();
    expect(run.state.chat.slice(-2).map(({ kind, text }) => [kind, text])).toEqual([
      ['visitor', 'wow, a marquee!'],
      ['agent', TEST_COPY.scriptedReply],
    ]);
  });

  it('requests a reply with the step on screen and the conversation so far', () => {
    const run = new ShowTestRun(RETRO_SHOW, { llm: true });
    chatOpen(run);
    run.dispatch({ type: 'visitorSent', text: 'first' });
    expect(run.state.visitor.request?.input).toEqual({
      step: null,
      stepsDone: 0,
      messages: [{ role: 'user', content: 'first' }],
    });
    expect(canSend(run.state)).toBe(false);
    run.dispatch({ type: 'replyDelta', text: 'Hel' }).dispatch({ type: 'replyDelta', text: 'lo' });
    run.dispatch({ type: 'replyEnded' });
    expect(agentLines(run.state).at(-1)).toBe('Hello');

    run.advanceUntil(inStep('layout'));
    run.dispatch({ type: 'visitorSent', text: 'second' });
    expect(run.state.visitor.request?.input).toEqual({
      step: 'layout',
      stepsDone: 2,
      messages: [
        { role: 'user', content: 'first' },
        { role: 'assistant', content: 'Hello' },
        { role: 'user', content: 'second' },
      ],
    });
  });

  it('falls back to a scripted reply on failure, and stays scripted after two in a row', () => {
    const run = new ShowTestRun(RETRO_SHOW, { llm: true });
    chatOpen(run);
    run
      .dispatch({ type: 'visitorSent', text: 'one' })
      .dispatch({ type: 'replyFailed', code: 'upstream_error' });
    expect(agentLines(run.state).at(-1)).toBe(TEST_COPY.scriptedReply);
    expect(run.state.visitor.scripted).toBe(false);
    run
      .dispatch({ type: 'visitorSent', text: 'two' })
      .dispatch({ type: 'replyFailed', code: 'upstream_error' });
    expect(run.state.visitor.scripted).toBe(true);
    run.dispatch({ type: 'visitorSent', text: 'three' });
    expect(run.state.visitor.request).toBeNull();
    expect(agentLines(run.state).at(-1)).toBe(TEST_COPY.scriptedReply);
  });

  it('stays scripted right after `unavailable` or `rate_limited`', () => {
    const run = new ShowTestRun(RETRO_SHOW, { llm: true });
    chatOpen(run);
    run
      .dispatch({ type: 'visitorSent', text: 'one' })
      .dispatch({ type: 'replyFailed', code: 'rate_limited' });
    expect(run.state.visitor.scripted).toBe(true);
  });

  it('takes 10 messages, refuses long ones, and ignores messages before the chat opens', () => {
    const run = new ShowTestRun(RETRO_SHOW);
    run.dispatch({ type: 'visitorSent', text: 'too early' });
    expect(run.state.chat).toEqual([]);
    chatOpen(run);
    run.dispatch({ type: 'visitorSent', text: 'x'.repeat(501) });
    expect(run.state.chat.at(-1)?.text).toBe(TEST_COPY.tooLong);
    for (let i = 0; i < MAX_VISITOR_MESSAGES; i++)
      run.dispatch({ type: 'visitorSent', text: `m${i}` });
    expect(canSend(run.state)).toBe(false);
    run.dispatch({ type: 'visitorSent', text: 'one more' });
    expect(run.state.chat.filter(({ kind }) => kind === 'visitor')).toHaveLength(
      MAX_VISITOR_MESSAGES,
    );
  });

  it('says once when the visitor goes offline', () => {
    const run = new ShowTestRun(RETRO_SHOW);
    run.dispatch({ type: 'offline', offline: true }).dispatch({ type: 'offline', offline: true });
    expect(run.state.chat.map(({ text }) => text)).toEqual([TEST_COPY.offline]);
  });
});
