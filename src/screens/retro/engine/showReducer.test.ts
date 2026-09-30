import { RETRO_FINALE_FALLBACK, RETRO_STEPS } from '../../../data/retro';
import { layersFromDisk } from '../layerFilesTestHarness';
import { RETRO_SHOW } from '../scenario';
import type { ShowSource } from './consolePlan';
import { canSend, MAX_VISITOR_MESSAGES } from './showReducer';
import { ShowTestRun, TEST_COPY } from './showTestRun';
import { TIMING } from './timing';
import type { ShowState } from './showTypes';

let source: ShowSource;
beforeAll(async () => {
  source = { ...RETRO_SHOW, layers: await layersFromDisk() };
});

const agentLines = (state: ShowState) =>
  state.chat.filter(({ kind }) => kind === 'agent').map(({ text }) => text);
const inStep = (id: string, stage?: string) => (state: ShowState) =>
  state.phase === 'steps' &&
  state.config.plan.steps[state.step]?.id === id &&
  (!stage || state.stage === stage);

describe('showReducer: timeline', () => {
  it('opens the chat after 3 s, then the console, then runs every step to done', () => {
    const run = new ShowTestRun(source);
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

    run.advanceUntil(inStep('tokens'));
    expect(agentLines(run.state).at(-1)).toBe(RETRO_STEPS[0]?.fallback);

    run.advanceUntil(() => run.status('module:ai-chat') === 'running');
    expect(run.status('module:ai-chat')).toBe('running');
    run.dispatch({ type: 'moduleLoaded', key: 'module:ai-chat' });
    run.advanceUntil((state) => state.phase === 'finale');
    expect(agentLines(run.state).at(-1)).toBe(RETRO_FINALE_FALLBACK);
    expect(Object.values(run.state.effects).every(({ status }) => status === 'applied')).toBe(true);

    run.advanceUntil((state) => state.phase === 'done');
    expect(run.state.phase).toBe('done');
  });

  it('applies each effect when its own text is typed, not at the end of the step', () => {
    const run = new ShowTestRun(source);
    run.advanceUntil(inStep('tokens', 'type'));
    run.advanceUntil(() => run.status('layer:tokens-type') === 'applied', 10_000);
    expect(run.status('layer:tokens-colors')).toBe('pending');
    expect(run.status('layer:page-colors')).toBe('pending');
    const typedFor = run.advanceUntil(() => run.status('layer:page-colors') === 'applied');
    expect(typedFor).toBeGreaterThan(0);
    // The step is clamped to 5 s of typing (SPEC: 1.2–5 s).
    expect(run.state.t - run.state.stageAt).toBeLessThanOrEqual(TIMING.stepMaxMs);
  });

  it('shows the LLM line for a step when it arrived, and the fallback otherwise', () => {
    const run = new ShowTestRun(source, { llm: true });
    run.dispatch({ type: 'narrationLine', key: 'layout', text: 'LLM says: layout.' });
    run.dispatch({ type: 'narrationLine', key: 'layout', text: 'A second line is ignored.' });
    run.advanceUntil(inStep('tokens'));
    expect(agentLines(run.state).at(-1)).toBe(RETRO_STEPS[0]?.fallback);
    run.advanceUntil(inStep('layout'));
    expect(agentLines(run.state).at(-1)).toBe('LLM says: layout.');
  });

  it('with reduced motion applies a step at once, 1 s after its code shows', () => {
    const run = new ShowTestRun(source, { reducedMotion: true });
    run.advanceUntil(inStep('tokens', 'type'));
    run.advance(TIMING.reducedMotionApplyMs - 1);
    expect(run.status('layer:tokens-type')).toBe('pending');
    run.advance(1);
    expect(
      ['tokens-type', 'tokens-colors', 'type-faces', 'page-colors'].map((id) =>
        run.status(`layer:${id}`),
      ),
    ).toEqual(['applied', 'applied', 'applied', 'applied']);
  });
});

describe('showReducer: holds', () => {
  it('freezes everything while the tab is hidden and resumes where it stopped', () => {
    const run = new ShowTestRun(source);
    run.advance(2_000).dispatch({ type: 'visibility', hidden: true });
    run.advance(60_000);
    expect(run.state.phase).toBe('idle');
    expect(run.state.t).toBe(2_000);
    run.dispatch({ type: 'visibility', hidden: false }).advance(1_000);
    expect(run.state.phase).toBe('chat');
  });

  it('holds before typing while the visitor composes, up to 15 s', () => {
    const run = new ShowTestRun(source);
    run.advanceUntil(inStep('tokens', 'narrate'));
    run.dispatch({ type: 'composing', on: true });
    run.advance(TIMING.narrateMs + 5_000);
    expect(run.state.stage).toBe('narrate');
    run.dispatch({ type: 'composing', on: false });
    expect(run.state.stage).toBe('type');

    run.advanceUntil(inStep('layout', 'narrate'));
    run.dispatch({ type: 'composing', on: true });
    run.advance(TIMING.narrateMs + TIMING.composingCapMs - 10);
    expect(run.state.stage).toBe('narrate');
    run.advance(10);
    expect(run.state.stage).toBe('type');
    expect(run.state.stageAt).toBe(run.state.t);
  });

  it('never holds mid-typing: a step always completes as shown', () => {
    const run = new ShowTestRun(source);
    run.advanceUntil(inStep('tokens', 'type'));
    run.dispatch({ type: 'composing', on: true });
    run.advanceUntil(inStep('tokens', 'settle'), 10_000);
    expect(run.state.stage).toBe('settle');
  });

  it('holds the next step while a reply streams, up to 12 s', () => {
    const run = new ShowTestRun(source, { llm: true });
    run.advanceUntil(inStep('tokens', 'settle'));
    run.dispatch({ type: 'visitorSent', text: 'nice' });
    expect(run.state.visitor.request).not.toBeNull();
    run.advance(TIMING.settleMs + TIMING.answeringCapMs - 10);
    expect(run.state.step).toBe(0);
    run.advance(10);
    expect(inStep('layout')(run.state)).toBe(true);
  });
});

describe('showReducer: failures never block', () => {
  it('skips a module that fails and still reaches done', () => {
    const run = new ShowTestRun(source);
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
    const run = new ShowTestRun(source);
    run.advanceUntil(() => run.status('module:ai-chat') === 'running');
    run.advance(TIMING.moduleTimeoutMs);
    expect(run.state.effects['module:ai-chat']).toMatchObject({
      status: 'skipped',
      reason: "ai-chat didn't load in 5 s",
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
    const run = new ShowTestRun(source, { llm: false });
    chatOpen(run);
    run.dispatch({ type: 'visitorSent', text: '  wow, a marquee!  ' });
    expect(run.state.visitor.request).toBeNull();
    expect(run.state.chat.slice(-2).map(({ kind, text }) => [kind, text])).toEqual([
      ['visitor', 'wow, a marquee!'],
      ['agent', TEST_COPY.scriptedReply],
    ]);
  });

  it('requests a reply with the step on screen and the conversation so far', () => {
    const run = new ShowTestRun(source, { llm: true });
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
      stepsDone: 1,
      messages: [
        { role: 'user', content: 'first' },
        { role: 'assistant', content: 'Hello' },
        { role: 'user', content: 'second' },
      ],
    });
  });

  it('falls back to a scripted reply on failure, and stays scripted after two in a row', () => {
    const run = new ShowTestRun(source, { llm: true });
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
    const run = new ShowTestRun(source, { llm: true });
    chatOpen(run);
    run
      .dispatch({ type: 'visitorSent', text: 'one' })
      .dispatch({ type: 'replyFailed', code: 'rate_limited' });
    expect(run.state.visitor.scripted).toBe(true);
  });

  it('takes 10 messages, refuses long ones, and ignores messages before the chat opens', () => {
    const run = new ShowTestRun(source);
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
    const run = new ShowTestRun(source);
    run.dispatch({ type: 'offline', offline: true }).dispatch({ type: 'offline', offline: true });
    expect(run.state.chat.map(({ text }) => text)).toEqual([TEST_COPY.offline]);
  });
});
