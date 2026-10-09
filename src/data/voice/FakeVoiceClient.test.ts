import type { AgentToolCall } from '../chat/contract';
import { FAKE_VOICE_SCRIPT, FakeVoiceClient } from './FakeVoiceClient';
import { DEMO_VOICE_INTRO, DEMO_VOICE_LOOP, createDemoVoiceClient } from './demoVoiceScript';
import type { VoiceCallEvent, VoiceCallHandlers } from './VoiceClient';

const session = { v: 1 as const, conversationToken: 'fake', maxCallSeconds: 180 };

function recorder() {
  const events: VoiceCallEvent[] = [];
  const toolCalls: AgentToolCall[] = [];
  const handlers: VoiceCallHandlers = {
    onEvent: (event) => events.push(event),
    onToolCall: (call) => {
      toolCalls.push(call);
      return Promise.resolve({ ok: true });
    },
  };
  return { events, toolCalls, handlers };
}

describe('FakeVoiceClient', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('plays the scripted call: lines, a scroll, a correction, the agent hangs up', async () => {
    const { events, toolCalls, handlers } = recorder();
    const client = new FakeVoiceClient({ stepMs: 10 });
    await client.start(session, handlers);
    await vi.advanceTimersByTimeAsync(10 * FAKE_VOICE_SCRIPT.length);

    expect(events[0]).toEqual({ type: 'status', status: 'connecting' });
    expect(events[1]).toEqual({ type: 'status', status: 'live' });
    expect(events.filter((e) => e.type === 'line').map((e) => e.line.role)).toEqual([
      'agent',
      'visitor',
      'agent',
      'visitor',
      'agent',
    ]);
    expect(events).toContainEqual(expect.objectContaining({ type: 'correction', id: 'agent-2' }));
    expect(toolCalls).toEqual([
      { id: 'voice-1', name: 'scrollToSection', input: { section: 'impact' } },
    ]);
    expect(events.at(-1)).toEqual({ type: 'ended', reason: 'agent' });
  });

  it('repeats the loop with unique line ids until the visitor ends the call', async () => {
    const { events, toolCalls, handlers } = recorder();
    const client = new FakeVoiceClient({
      stepMs: 10,
      script: DEMO_VOICE_INTRO,
      loop: DEMO_VOICE_LOOP,
    });
    const call = await client.start(session, handlers);
    await vi.advanceTimersByTimeAsync(10 * (DEMO_VOICE_INTRO.length + 3 * DEMO_VOICE_LOOP.length));

    expect(events.some((e) => e.type === 'ended')).toBe(false);
    const ids = events.flatMap((e) => (e.type === 'line' ? [e.line.id] : []));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('demo-agent-2-r3');
    expect(events).toContainEqual({
      type: 'correction',
      id: 'demo-agent-2-r1',
      text: 'This is his selected impact.',
    });
    expect(toolCalls).toHaveLength(9);

    await call.end();
    const count = events.length;
    await vi.advanceTimersByTimeAsync(10 * DEMO_VOICE_LOOP.length);
    expect(events).toHaveLength(count);
    expect(events.at(-1)).toEqual({ type: 'ended', reason: 'visitor' });
  });

  it('builds the demo client without a microphone prompt', async () => {
    await expect(createDemoVoiceClient().requestMicrophone()).resolves.toBe('granted');
  });

  it('ends early with the given reason, once, and stops the script', async () => {
    const { events, handlers } = recorder();
    const call = await new FakeVoiceClient({ stepMs: 10 }).start(session, handlers);
    await vi.advanceTimersByTimeAsync(10);
    await call.end('time_limit');
    await call.end();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(events.filter((e) => e.type === 'ended')).toEqual([
      { type: 'ended', reason: 'time_limit' },
    ]);
    expect(events.at(-1)).toEqual({ type: 'ended', reason: 'time_limit' });
  });

  it('records mute and contextual updates; a muted mic has no input level', async () => {
    const { handlers } = recorder();
    const client = new FakeVoiceClient({ stepMs: 10, script: [] });
    const call = await client.start(session, handlers);
    expect(call.levels().input).toBeGreaterThan(0);
    call.setMuted(true);
    call.sendContextualUpdate('30 seconds left');
    expect(client.calls[0]?.muted).toBe(true);
    expect(client.calls[0]?.contextualUpdates).toEqual(['30 seconds left']);
    expect(call.levels()).toEqual({ input: 0, output: 0 });
  });

  it('can deny the microphone and fail to connect', async () => {
    const client = new FakeVoiceClient({ stepMs: 10, microphone: 'denied', failStart: true });
    expect(await client.requestMicrophone()).toBe('denied');
    const { events, handlers } = recorder();
    const started = client.start(session, handlers);
    const assertion = expect(started).rejects.toThrow('start failed');
    await vi.advanceTimersByTimeAsync(10);
    await assertion;
    expect(events).toEqual([{ type: 'status', status: 'connecting' }]);
  });
});
