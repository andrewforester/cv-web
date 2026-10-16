import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AppProviders } from '../../../app/AppProviders';
import { FakeChatRepository, type AgentPageStateV4 } from '../../../data/chat';
import type { VoiceCall, VoiceCallHandlers } from '../../../data/voice';
import type { ChatEntry, ChatTurn } from '../ChatUiState';
import type { ChatVoiceCall } from './callReducer';
import { earlierConversation } from './earlierConversation';
import { useVoiceCall } from './useVoiceCall';
import { ManualVoiceClient, StubSessionRepository } from './voiceTestHarness';

const page: AgentPageStateV4 = {
  viewport: 'desktop',
  chat: 'card',
  activeSection: null,
  highlighted: null,
  tools: [],
};

const answered: ChatTurn = {
  kind: 'turn',
  id: 'turn-1',
  question: 'What did he build at Transcenda?',
  page,
  rounds: [],
  answer: 'He led the mobile apps.',
  status: 'done',
};

const earlierCall: ChatVoiceCall = {
  kind: 'call',
  id: 'call-0',
  status: 'ended',
  items: [{ kind: 'line', id: 'visitor-1', role: 'visitor', text: 'And before that?' }],
};

/** The SDK's order: `live` (its `onConnect`) comes before `start()` resolves. */
class EarlyLiveClient extends ManualVoiceClient {
  override start(session: unknown, handlers: VoiceCallHandlers): Promise<VoiceCall> {
    const call = super.start(session, handlers);
    handlers.onEvent({ type: 'status', status: 'live' });
    return call;
  }
}

function renderVoiceCall(client: ManualVoiceClient, entries: readonly ChatEntry[]) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AppProviders
      chatRepository={new FakeChatRepository()}
      voiceClient={client}
      voiceSessionRepository={new StubSessionRepository()}
    >
      {children}
    </AppProviders>
  );
  return renderHook(
    ({ conversation }) =>
      useVoiceCall({
        record: vi.fn(),
        entries: conversation,
        onEnded: vi.fn(),
        onNeedsPanel: vi.fn(),
      }),
    { wrapper, initialProps: { conversation: entries } },
  );
}

async function startCall(client: ManualVoiceClient, entries: readonly ChatEntry[]) {
  const rendered = renderVoiceCall(client, entries);
  act(() => rendered.result.current.actions.start());
  await waitFor(() => expect(client.call).not.toBeNull());
  return rendered;
}

describe('useVoiceCall: the earlier conversation', () => {
  it('sends the chat so far once, when the call goes live', async () => {
    const client = new ManualVoiceClient();
    const entries = [answered, earlierCall];
    const { rerender } = await startCall(client, entries);
    expect(client.call?.contextualUpdates).toEqual([]);

    client.emit({ type: 'status', status: 'live' });
    expect(client.call?.contextualUpdates).toEqual([earlierConversation(entries)]);

    // The call's own lines and a second `live` don't send it again.
    client.emit(
      { type: 'line', line: { id: 'agent-1', role: 'agent', text: 'Hi!' } },
      { type: 'status', status: 'live' },
    );
    rerender({ conversation: [...entries, answered] });
    client.emit({ type: 'mode', mode: 'listening' });
    expect(client.call?.contextualUpdates).toHaveLength(1);
  });

  it('waits for the connected call when `live` comes first (the SDK order)', async () => {
    const client = new EarlyLiveClient();
    await startCall(client, [answered]);
    await waitFor(() =>
      expect(client.call?.contextualUpdates).toEqual([earlierConversation([answered])]),
    );
  });

  it('sends nothing when nothing was said before the call', async () => {
    const client = new ManualVoiceClient();
    await startCall(client, []);
    client.emit({ type: 'status', status: 'live' });
    expect(client.call?.contextualUpdates).toEqual([]);
  });

  it('briefs every new call with what came before it', async () => {
    const client = new ManualVoiceClient();
    const { result, rerender } = await startCall(client, []);
    client.emit({ type: 'status', status: 'live' }, { type: 'ended', reason: 'agent' });

    rerender({ conversation: [answered] });
    const first = client.call;
    act(() => result.current.actions.start());
    await waitFor(() => expect(client.call).not.toBe(first));
    client.emit({ type: 'status', status: 'live' });
    expect(client.call?.contextualUpdates).toEqual([earlierConversation([answered])]);
  });
});
