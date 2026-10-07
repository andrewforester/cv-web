import type { AgentToolCall } from '../chat/contract';
import { FAKE_VOICE_SCRIPT, FakeVoiceClient } from './FakeVoiceClient';
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
