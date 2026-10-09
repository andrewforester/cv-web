import { AGENT_TOOL_NAMES, type AgentToolCall } from '../chat/contract';
import { ElevenLabsVoiceClient, type ElevenLabsSdk } from './ElevenLabsVoiceClient';
import type { VoiceCallEvent, VoiceCallHandlers } from './VoiceClient';

const session = { v: 1 as const, conversationToken: 'tok_123', maxCallSeconds: 180 };

/** The options `startSession` got, with the callbacks the adapter registered. */
interface SdkOptions {
  conversationToken: string;
  connectionType: string;
  workletPaths: Record<string, string>;
  clientTools: Record<string, (parameters: unknown) => Promise<string>>;
  onConnect(props: { conversationId: string }): void;
  onModeChange(props: { mode: 'listening' | 'speaking' }): void;
  onMessage(props: { role: 'user' | 'agent'; message: string; event_id: number }): void;
  onAgentResponseCorrection(props: { event_id: number; corrected_agent_response: string }): void;
  onDisconnect(details: { reason: 'user' | 'agent' | 'error'; message?: string }): void;
}

function stubSdk({ fail = false } = {}) {
  let options: SdkOptions | undefined;
  const conversation = {
    endSession: vi.fn(() => {
      options?.onDisconnect({ reason: 'user' });
      return Promise.resolve();
    }),
    setMicMuted: vi.fn(),
    sendContextualUpdate: vi.fn(),
    sendUserMessage: vi.fn(),
    sendUserActivity: vi.fn(),
    getInputVolume: vi.fn(() => 0.4),
    getOutputVolume: vi.fn(() => 1.7),
  };
  const startSession = vi.fn((received: SdkOptions) => {
    options = received;
    return fail ? Promise.reject(new Error('busy')) : Promise.resolve(conversation);
  });
  const sdk = { Conversation: { startSession } } as unknown as ElevenLabsSdk;
  const load = vi.fn(() => Promise.resolve(sdk));
  return { load, conversation, startSession, sdkOptions: () => options as SdkOptions };
}

function recorder() {
  const events: VoiceCallEvent[] = [];
  const toolCalls: AgentToolCall[] = [];
  const handlers: VoiceCallHandlers = {
    onEvent: (event) => events.push(event),
    onToolCall: (call) => {
      toolCalls.push(call);
      return Promise.resolve({ ok: false, error: 'not_available' });
    },
  };
  return { events, toolCalls, handlers };
}

describe('ElevenLabsVoiceClient', () => {
  it('starts a WebRTC session with the token and self-hosted worklets', async () => {
    const sdk = stubSdk();
    await new ElevenLabsVoiceClient(sdk.load).start(session, recorder().handlers);
    const options = sdk.sdkOptions();
    expect(options.conversationToken).toBe('tok_123');
    expect(options.connectionType).toBe('webrtc');
    expect(Object.keys(options.workletPaths).sort()).toEqual([
      'audioConcatProcessor',
      'rawAudioProcessor',
    ]);
    for (const path of Object.values(options.workletPaths))
      expect(path).not.toMatch(/^(blob|data|https?):/);
  });

  it('maps SDK callbacks to call events', async () => {
    const sdk = stubSdk();
    const { events, handlers } = recorder();
    await new ElevenLabsVoiceClient(sdk.load).start(session, handlers);
    const options = sdk.sdkOptions();
    options.onConnect({ conversationId: 'conv_1' });
    options.onModeChange({ mode: 'speaking' });
    options.onMessage({ role: 'agent', message: 'Hi there.', event_id: 1 });
    options.onMessage({ role: 'user', message: 'Hello', event_id: 2 });
    options.onMessage({ role: 'agent', message: 'A long answer', event_id: 2 });
    options.onAgentResponseCorrection({ event_id: 2, corrected_agent_response: 'A long' });
    options.onDisconnect({ reason: 'agent' });
    options.onMessage({ role: 'agent', message: 'after the end', event_id: 3 });

    expect(events).toEqual([
      { type: 'status', status: 'connecting' },
      { type: 'status', status: 'live' },
      { type: 'mode', mode: 'speaking' },
      { type: 'line', line: { id: 'agent-1', role: 'agent', text: 'Hi there.' } },
      { type: 'line', line: { id: 'visitor-2', role: 'visitor', text: 'Hello' } },
      { type: 'line', line: { id: 'agent-2', role: 'agent', text: 'A long answer' } },
      { type: 'correction', id: 'agent-2', text: 'A long' },
      { type: 'ended', reason: 'agent' },
    ]);
  });

  it('ends with the error message when the connection drops', async () => {
    const sdk = stubSdk();
    const { events, handlers } = recorder();
    await new ElevenLabsVoiceClient(sdk.load).start(session, handlers);
    sdk.sdkOptions().onDisconnect({ reason: 'error', message: 'ICE failed' });
    expect(events.at(-1)).toEqual({ type: 'ended', reason: 'error', message: 'ICE failed' });
  });

  it('registers one client tool per catalogue name; the agent reads the JSON result', async () => {
    const sdk = stubSdk();
    const { toolCalls, handlers } = recorder();
    await new ElevenLabsVoiceClient(sdk.load).start(session, handlers);
    const tools = sdk.sdkOptions().clientTools;
    expect(Object.keys(tools).sort()).toEqual([...AGENT_TOOL_NAMES].sort());

    const result = await tools.scrollToSection?.({ section: 'impact' });
    await tools.highlightElement?.('not an object');
    expect(result).toBe('{"ok":false,"error":"not_available"}');
    expect(toolCalls).toEqual([
      { id: 'voice-1', name: 'scrollToSection', input: { section: 'impact' } },
      { id: 'voice-2', name: 'highlightElement', input: {} },
    ]);
  });

  it('ends once with the given reason; mute, contextual updates and levels go to the SDK', async () => {
    const sdk = stubSdk();
    const { events, handlers } = recorder();
    const call = await new ElevenLabsVoiceClient(sdk.load).start(session, handlers);
    call.setMuted(true);
    call.sendContextualUpdate('30 seconds left');
    expect(sdk.conversation.setMicMuted).toHaveBeenCalledWith(true);
    expect(sdk.conversation.sendContextualUpdate).toHaveBeenCalledWith('30 seconds left');
    expect(call.levels()).toEqual({ input: 0.4, output: 1 });

    await call.end('time_limit');
    await call.end();
    expect(sdk.conversation.endSession).toHaveBeenCalledTimes(1);
    expect(events.filter((e) => e.type === 'ended')).toEqual([
      { type: 'ended', reason: 'time_limit' },
    ]);
    expect(call.levels()).toEqual({ input: 0, output: 0 });
  });

  describe('typed lines', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    async function liveCall() {
      const sdk = stubSdk();
      const { events, handlers } = recorder();
      const call = await new ElevenLabsVoiceClient(sdk.load).start(session, handlers);
      const visitorLines = () =>
        events.flatMap((e) =>
          e.type === 'line' && e.line.role === 'visitor' ? [e.line.text] : [],
        );
      return { sdk, call, events, visitorLines, options: sdk.sdkOptions() };
    }

    it('sends a typed line as the visitor turn and typing as user activity, with no line event', async () => {
      const { sdk, call, events } = await liveCall();
      call.typing();
      call.sendText('What does he do now?');
      expect(sdk.conversation.sendUserActivity).toHaveBeenCalledTimes(1);
      expect(sdk.conversation.sendUserMessage).toHaveBeenCalledWith('What does he do now?');
      expect(events.some((e) => e.type === 'line')).toBe(false);
    });

    it('drops the echo of a typed line once; a different line and a repeat are kept', async () => {
      const { call, options, visitorLines } = await liveCall();
      call.sendText('  Where does he work?');
      options.onMessage({ role: 'agent', message: 'Where does he work?', event_id: 1 });
      options.onMessage({ role: 'user', message: 'Something else', event_id: 2 });
      options.onMessage({ role: 'user', message: 'Where does he work? ', event_id: 3 });
      options.onMessage({ role: 'user', message: 'Where does he work?', event_id: 4 });
      expect(visitorLines()).toEqual(['Something else', 'Where does he work?']);
    });

    it('matches only the oldest typed line, in the order they were sent', async () => {
      const { call, options, visitorLines } = await liveCall();
      call.sendText('first');
      call.sendText('second');
      options.onMessage({ role: 'user', message: 'second', event_id: 1 });
      options.onMessage({ role: 'user', message: 'first', event_id: 2 });
      options.onMessage({ role: 'user', message: 'second', event_id: 3 });
      expect(visitorLines()).toEqual(['second']);
    });

    it('keeps a matching visitor line that comes more than 10 s after the typed one', async () => {
      const { call, options, visitorLines } = await liveCall();
      call.sendText('Tell me about his apps');
      vi.advanceTimersByTime(10_001);
      options.onMessage({ role: 'user', message: 'Tell me about his apps', event_id: 1 });
      expect(visitorLines()).toEqual(['Tell me about his apps']);
    });

    it('sends nothing after the call ended', async () => {
      const { sdk, call } = await liveCall();
      await call.end();
      call.sendText('too late');
      call.typing();
      expect(sdk.conversation.sendUserMessage).not.toHaveBeenCalled();
      expect(sdk.conversation.sendUserActivity).not.toHaveBeenCalled();
    });
  });

  it('rejects when the session fails to start, with no ended event', async () => {
    const sdk = stubSdk({ fail: true });
    const { events, handlers } = recorder();
    await expect(new ElevenLabsVoiceClient(sdk.load).start(session, handlers)).rejects.toThrow(
      'busy',
    );
    sdk.sdkOptions().onDisconnect({ reason: 'error', message: 'late' });
    expect(events).toEqual([{ type: 'status', status: 'connecting' }]);
  });

  it('loads the SDK once, and again after a failed load', async () => {
    const sdk = stubSdk();
    const load = vi
      .fn<() => Promise<ElevenLabsSdk>>()
      .mockRejectedValueOnce(new Error('chunk failed'))
      .mockImplementation(sdk.load);
    const client = new ElevenLabsVoiceClient(load);
    await expect(client.start(session, recorder().handlers)).rejects.toThrow('chunk failed');
    await client.start(session, recorder().handlers);
    await client.start(session, recorder().handlers);
    expect(load).toHaveBeenCalledTimes(2);
  });

  describe('requestMicrophone', () => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');
    afterEach(() => {
      if (original) Object.defineProperty(navigator, 'mediaDevices', original);
      else Reflect.deleteProperty(navigator, 'mediaDevices');
    });

    function stubMedia(getUserMedia: () => Promise<MediaStream>) {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: { getUserMedia },
      });
    }

    it('grants, stops the probe tracks and warms the SDK chunk', async () => {
      const stop = vi.fn();
      stubMedia(() => Promise.resolve({ getTracks: () => [{ stop }] } as unknown as MediaStream));
      const sdk = stubSdk();
      expect(await new ElevenLabsVoiceClient(sdk.load).requestMicrophone()).toBe('granted');
      expect(stop).toHaveBeenCalled();
      expect(sdk.load).toHaveBeenCalledTimes(1);
    });

    it('is denied when the visitor blocks it or there is no media API', async () => {
      stubMedia(() => Promise.reject(new DOMException('blocked', 'NotAllowedError')));
      expect(await new ElevenLabsVoiceClient(stubSdk().load).requestMicrophone()).toBe('denied');
      Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: undefined });
      expect(await new ElevenLabsVoiceClient(stubSdk().load).requestMicrophone()).toBe('denied');
    });
  });
});
