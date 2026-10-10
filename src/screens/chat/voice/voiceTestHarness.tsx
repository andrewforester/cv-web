import { act, render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { vi } from 'vitest';
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
import { CHAT_SLIDE_QUERY, type ChatDock, type ChatLayout } from '../chatDock';
import { ChatRoute } from '../ChatRoute';
import { FakeAgentExecutor } from '../fakeAgentExecutor';
import { chatTestIds } from '../testIds';

/** A call the test drives by hand: it records what the call asked of it. */
export class ManualVoiceCall implements VoiceCall {
  muted = false;
  ended: string | null = null;
  typings = 0;
  readonly contextualUpdates: string[] = [];
  readonly sentTexts: string[] = [];
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
  sendText(text: string) {
    this.sentTexts.push(text);
  }
  typing() {
    this.typings += 1;
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

/**
 * Makes the chat's media queries see a viewport of this layout (jsdom has no `matchMedia`, so
 * without a stub the chat is the medium floating card). Undo with `vi.unstubAllGlobals()`.
 */
export function stubLayout(layout: ChatLayout) {
  const matches = (query: string) =>
    layout === 'sheet'
      ? query.includes('max-width: 599px')
      : layout === 'slide' && query === CHAT_SLIDE_QUERY;
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: matches(query),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

/** The chat widget (closed) with a voice client, a session stub and the page's tools as a fake. */
export async function renderVoiceChat({
  client = new ManualVoiceClient() as VoiceClient | null,
  sessions = new StubSessionRepository(),
  chat = new FakeChatRepository(),
  onDockChange,
  advanceTimers,
}: {
  client?: VoiceClient | null;
  sessions?: StubSessionRepository;
  chat?: FakeChatRepository;
  onDockChange?: (dock: ChatDock) => void;
  advanceTimers?: (ms: number) => void;
} = {}) {
  const page = await new StaticCvRepository().getCvPage();
  const executor = new FakeAgentExecutor(buildCvPageToolSpecs(page));
  const user = userEvent.setup(advanceTimers ? { advanceTimers } : {});
  render(
    <AppProviders chatRepository={chat} voiceClient={client} voiceSessionRepository={sessions}>
      <AgentExecutorContext value={executor}>
        <ChatRoute onDockChange={onDockChange} />
      </AgentExecutorContext>
    </AppProviders>,
  );
  return { user, executor, sessions };
}

/** The visitor's way into a call: the "Talk to my AI" pill opens the chat, then Call. */
export async function startCall(user: UserEvent) {
  await user.click(screen.getByTestId(chatTestIds.fab));
  await user.click(screen.getByTestId(chatTestIds.voiceCall));
}
