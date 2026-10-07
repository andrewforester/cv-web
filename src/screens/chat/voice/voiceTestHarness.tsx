import { act, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProviders } from '../../../app/AppProviders';
import { buildCvPageToolSpecs, FakeChatRepository, type AgentToolCall } from '../../../data/chat';
import { StaticCvRepository } from '../../../data/cv/StaticCvRepository';
import type {
  VoiceCall,
  VoiceCallEvent,
  VoiceCallHandlers,
  VoiceClient,
  VoiceError,
  VoiceSessionRepository,
  VoiceSessionResult,
} from '../../../data/voice';
import { AgentExecutorContext } from '../agentExecutor';
import { ChatRoute } from '../ChatRoute';
import { FakeAgentExecutor } from '../fakeAgentExecutor';

/** A call the test drives by hand: it records what the voice mode asked of it. */
export class ManualVoiceCall implements VoiceCall {
  muted = false;
  ended: string | null = null;
  readonly contextualUpdates: string[] = [];
  constructor(private readonly handlers: VoiceCallHandlers) {}

  end(reason: 'visitor' | 'time_limit' = 'visitor'): Promise<void> {
    this.ended = reason;
    this.handlers.onEvent({ type: 'ended', reason });
    return Promise.resolve();
  }
  levels() {
    return { input: 0.3, output: 0.6 };
  }
  setMuted(muted: boolean) {
    this.muted = muted;
  }
  sendContextualUpdate(text: string) {
    this.contextualUpdates.push(text);
  }
}

/** A `VoiceClient` whose events and tool calls the test sends itself (`emit`, `tool`). */
export class ManualVoiceClient implements VoiceClient {
  call: ManualVoiceCall | null = null;
  microphone: 'granted' | 'denied' = 'granted';
  failStart = false;
  private handlers: VoiceCallHandlers | null = null;

  requestMicrophone() {
    return Promise.resolve(this.microphone);
  }
  start(_session: unknown, handlers: VoiceCallHandlers): Promise<VoiceCall> {
    if (this.failStart) return Promise.reject(new Error('busy'));
    this.handlers = handlers;
    this.call = new ManualVoiceCall(handlers);
    return Promise.resolve(this.call);
  }
  emit(...events: VoiceCallEvent[]) {
    act(() => events.forEach((event) => this.handlers?.onEvent(event)));
  }
  /** The agent calls a page tool; resolves with what the agent would hear. */
  tool(call: Omit<AgentToolCall, 'id'>, id = 'voice-1') {
    if (!this.handlers) throw new Error('no call');
    return this.handlers.onToolCall({ id, ...call });
  }
}

export const SESSION: VoiceSessionResult = {
  ok: true,
  session: { v: 1, conversationToken: 'token', maxCallSeconds: 180 },
};

export const sessionError = (code: VoiceError['code']): VoiceSessionResult => ({
  ok: false,
  error: { code, message: code, retryable: false },
});

export class StubSessionRepository implements VoiceSessionRepository {
  requests = 0;
  constructor(public result: VoiceSessionResult = SESSION) {}
  create() {
    this.requests += 1;
    return Promise.resolve(this.result);
  }
}

/** The chat widget (closed) with a voice client, a session stub and the page's tools as a fake. */
export async function renderVoiceChat({
  client = new ManualVoiceClient() as VoiceClient | null,
  sessions = new StubSessionRepository(),
  advanceTimers,
}: {
  client?: VoiceClient | null;
  sessions?: StubSessionRepository;
  advanceTimers?: (ms: number) => void;
} = {}) {
  const page = await new StaticCvRepository().getCvPage();
  const executor = new FakeAgentExecutor(buildCvPageToolSpecs(page));
  const user = userEvent.setup(advanceTimers ? { advanceTimers } : {});
  render(
    <AppProviders
      chatRepository={new FakeChatRepository()}
      voiceClient={client}
      voiceSessionRepository={sessions}
    >
      <AgentExecutorContext value={executor}>
        <ChatRoute />
      </AgentExecutorContext>
    </AppProviders>,
  );
  return { user, executor, sessions };
}
