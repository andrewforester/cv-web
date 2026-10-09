import { screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { FakeChatRepository } from '../../../data/chat';
import { FakeVoiceClient } from '../../../data/voice';
import { answer } from '../chatTestHarness';
import { chatTestIds } from '../testIds';
import { ManualVoiceClient, renderVoiceChat, startCall } from './voiceTestHarness';

const voicePanel = () => screen.getByTestId(chatTestIds.voicePanel);

async function startLiveCall(user: UserEvent, client: ManualVoiceClient) {
  await startCall(user);
  await waitFor(() => expect(client.call).not.toBeNull());
  client.emit({ type: 'status', status: 'live' });
}

describe('call panel', () => {
  it('without a voice client (the flag off): no Call, and the launcher still says Talk to my AI', async () => {
    const { user } = await renderVoiceChat({ client: null });
    await user.click(screen.getByRole('button', { name: 'Talk to my AI' }));
    expect(screen.queryByTestId(chatTestIds.voiceCall)).not.toBeInTheDocument();
    expect(screen.getByTestId(chatTestIds.input)).toHaveAttribute('placeholder', 'Ask a question…');
  });

  it('one launcher; Call left of the field opens the panel (not modal) in "connecting"', async () => {
    const { user } = await renderVoiceChat();
    const launcher = screen.getByRole('button', { name: 'Talk to my AI' });
    // The pill is the launcher's only button: a call starts from the chat.
    expect(screen.getAllByRole('button')).toEqual([launcher]);
    await user.click(launcher);

    const call = screen.getByRole('button', { name: 'Call my AI' });
    expect(call).toHaveTextContent('Call');
    const input = screen.getByTestId(chatTestIds.input);
    expect(input).toHaveAttribute('placeholder', '…or type instead');
    expect(call.compareDocumentPosition(input)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    await user.click(call);

    const panel = screen.getByRole('complementary', { name: 'Voice call with Andrew’s AI' });
    expect(panel).toHaveAttribute('data-phase', 'connecting');
    expect(panel).toHaveFocus();
    expect(within(panel).getByText(/Calls run on ElevenLabs/)).toBeInTheDocument();
    expect(screen.getByTestId(chatTestIds.voiceMute)).toBeDisabled();
    expect(screen.getByTestId(chatTestIds.voiceMinimize)).toBeDisabled();
    expect(screen.getByTestId(chatTestIds.root)).toHaveAttribute('data-surface', 'call');
    // The chat and the launcher leave once their exits have played.
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.queryByTestId(chatTestIds.fab)).not.toBeInTheDocument();
  });

  it('Call is disabled while a text answer streams', async () => {
    const chat = new FakeChatRepository();
    const { user } = await renderVoiceChat({ chat });
    await user.click(screen.getByTestId(chatTestIds.fab));
    await user.type(screen.getByTestId(chatTestIds.input), 'What did he lead?{Enter}');
    await waitFor(() => expect(chat.isStreaming).toBe(true));
    expect(screen.getByTestId(chatTestIds.voiceCall)).toBeDisabled();

    chat.emit(...answer('He led mobile.'));
    await waitFor(() => expect(screen.getByTestId(chatTestIds.voiceCall)).toBeEnabled());
  });

  it('plays a scripted call into the chat: lines, a scroll, then the chat opens', async () => {
    const client = new FakeVoiceClient({ stepMs: 0 });
    const { user, executor } = await renderVoiceChat({ client });
    await startCall(user);

    // The call ends back in the chat; the call panel plays its close animation, then leaves.
    const root = screen.getByTestId(chatTestIds.root);
    await waitFor(() => expect(root).toHaveAttribute('data-surface', 'text'), { timeout: 3000 });
    await waitFor(() =>
      expect(screen.queryByTestId(chatTestIds.voicePanel)).not.toBeInTheDocument(),
    );
    const panel = screen.getByTestId(chatTestIds.panel);
    expect(executor.executed).toEqual([
      { id: 'voice-1', name: 'scrollToSection', input: { section: 'impact' } },
    ]);
    const list = within(within(panel).getByTestId(chatTestIds.list));
    expect(list.getAllByTestId(chatTestIds.voiceDivider).map((row) => row.textContent)).toEqual([
      'Voice call',
      'Call ended · 0:00',
    ]);
    expect(list.getAllByTestId(chatTestIds.visitorMessage).map((row) => row.textContent)).toEqual([
      'You: Show me his selected impact.',
      'You: Thanks, bye!',
    ]);
    // The interrupted answer keeps only what was spoken.
    expect(list.getByText('Here is his selected impact.')).toBeInTheDocument();
    expect(list.getByTestId(chatTestIds.actionChip)).toHaveTextContent(
      'Scrolled to Selected impact',
    );
    expect(within(panel).getByTestId(chatTestIds.input)).toHaveFocus();
  });

  it('shows the caption, mode and timer, and mutes the microphone', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await startLiveCall(user, client);
    client.emit(
      { type: 'mode', mode: 'speaking' },
      { type: 'line', line: { id: 'agent-1', role: 'agent', text: 'Hi there.' } },
    );
    expect(voicePanel()).toHaveAttribute('data-phase', 'speaking');
    expect(screen.getByTestId(chatTestIds.voiceStatus)).toHaveTextContent('Speaking');
    expect(screen.getByTestId(chatTestIds.voiceCaption)).toHaveTextContent('Hi there.');
    expect(screen.getByRole('timer')).toHaveAccessibleName('Call time 0:00 of 3:00');
    expect(screen.getByTestId(chatTestIds.voiceAnnouncer)).toHaveTextContent(
      'Connected. Start talking.',
    );

    client.emit({ type: 'mode', mode: 'listening' });
    await user.click(screen.getByRole('button', { name: 'Mute microphone' }));
    expect(client.call?.muted).toBe(true);
    expect(voicePanel()).toHaveAttribute('data-muted', 'true');
    expect(screen.getByTestId(chatTestIds.voiceStatus)).toHaveTextContent('Mic off');
    expect(screen.getByTestId(chatTestIds.voiceCaption)).toHaveTextContent(
      'Your microphone is off. Unmute to talk.',
    );
    const unmute = screen.getByRole('button', { name: 'Unmute microphone' });
    expect(unmute).toHaveAttribute('aria-pressed', 'true');
    await user.click(unmute);
    expect(client.call?.muted).toBe(false);
  });

  it('End with no lines goes back to the chat and gives the focus back to Call', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await startLiveCall(user, client);
    await user.click(screen.getByRole('button', { name: 'End call' }));

    expect(client.call?.ended).toBe('visitor');
    await waitFor(() => expect(screen.getByTestId(chatTestIds.voiceCall)).toHaveFocus());
    expect(screen.getByTestId(chatTestIds.root)).toHaveAttribute('data-surface', 'text');
  });

  it('Esc minimizes a live call (never ends it); while connecting it does nothing', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await startCall(user);
    await waitFor(() => expect(client.call).not.toBeNull());
    await user.keyboard('{Escape}');
    expect(voicePanel()).toBeInTheDocument();

    client.emit({ type: 'status', status: 'live' });
    await user.keyboard('{Escape}');
    expect(client.call?.ended).toBeNull();
    expect(await screen.findByTestId(chatTestIds.voicePillExpand)).toHaveFocus();
  });

  it('a call started after a text exchange gives the agent the earlier chat', async () => {
    const chat = new FakeChatRepository().reply(...answer('He led mobile.'));
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client, chat });
    await user.click(screen.getByTestId(chatTestIds.fab));
    await user.type(screen.getByTestId(chatTestIds.input), 'What did he lead?{Enter}');
    expect(await screen.findAllByText('He led mobile.')).not.toHaveLength(0);

    await user.click(screen.getByTestId(chatTestIds.voiceCall));
    expect(voicePanel()).toBeInTheDocument();
    await waitFor(() => expect(client.call).not.toBeNull());
    client.emit({ type: 'status', status: 'live' });
    expect(client.call?.contextualUpdates[0]).toContain('Visitor (typed): What did he lead?');
  });
});
