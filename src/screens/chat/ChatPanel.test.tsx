import { screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { FakeChatRepository } from '../../data/chat';
import { FakeVoiceClient } from '../../data/voice';
import { answer } from './chatTestHarness';
import { chatTestIds } from './testIds';
import { ManualVoiceClient, renderVoiceChat, startCall } from './voice/voiceTestHarness';

const voicePanel = () => screen.getByTestId(chatTestIds.voicePanel);

async function startLiveCall(user: UserEvent, client: ManualVoiceClient) {
  await startCall(user);
  await waitFor(() => expect(client.call).not.toBeNull());
  client.emit({ type: 'status', status: 'live' });
}

// The one panel (ADR-0013 → Decisions 1, 2): text, call and the chat during the call are views of
// one element; collapse and Esc fold it.
describe('the panel', () => {
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

    const panel = screen.getByRole('region', { name: 'Voice call with Andrew’s AI' });
    expect(panel).not.toHaveAttribute('aria-modal');
    expect(panel).toHaveAttribute('data-phase', 'connecting');
    expect(panel).toHaveFocus();
    expect(within(panel).getByText(/Calls run on ElevenLabs/)).toBeInTheDocument();
    expect(screen.getByTestId(chatTestIds.voiceMute)).toBeDisabled();
    expect(screen.getByTestId(chatTestIds.collapse)).toBeEnabled();
    expect(screen.getByTestId(chatTestIds.root)).toHaveAttribute('data-surface', 'call');
    // The chat's dialog became the call's region: no frame plays an exit.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId(chatTestIds.fab)).not.toBeInTheDocument());
  });

  it('plays a scripted call into the chat: lines, a scroll, then the chat opens', async () => {
    const client = new FakeVoiceClient({ stepMs: 0 });
    const { user, executor } = await renderVoiceChat({ client });
    await startCall(user);

    // The call ends back in the chat, in the same panel.
    const root = screen.getByTestId(chatTestIds.root);
    await waitFor(() => expect(root).toHaveAttribute('data-surface', 'text'), { timeout: 3000 });
    expect(screen.queryByTestId(chatTestIds.voicePanel)).not.toBeInTheDocument();
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

  it('is one element across text → call → callChat → text, its semantics following the view', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await user.click(screen.getByTestId(chatTestIds.fab));
    const panel = screen.getByRole('dialog', { name: 'Ask about Andrew' });
    expect(panel).toHaveAttribute('aria-modal', 'true');
    expect(panel).toHaveAccessibleDescription('AI assistant · answers from this page');
    const field = within(panel).getByTestId(chatTestIds.input);

    await user.click(screen.getByTestId(chatTestIds.voiceCall));
    expect(screen.getByTestId(chatTestIds.voicePanel)).toBe(panel);
    expect(panel).toHaveAccessibleName('Voice call with Andrew’s AI');
    expect(panel).not.toHaveAttribute('role');
    await waitFor(() => expect(client.call).not.toBeNull());
    client.emit({ type: 'status', status: 'live' });

    await user.click(screen.getByTestId(chatTestIds.voiceChatToggle));
    expect(screen.getByRole('dialog', { name: 'Voice call' })).toBe(panel);
    expect(panel).toHaveAttribute('data-phase', 'listening');
    // One composer: the same field in every view.
    expect(within(panel).getByTestId(chatTestIds.input)).toBe(field);

    await user.click(within(panel).getByTestId(chatTestIds.voiceEnd));
    expect(screen.getByRole('dialog', { name: 'Ask about Andrew' })).toBe(panel);
    expect(panel).not.toHaveAttribute('data-phase');
  });

  it('one collapse control in every header; nothing in the panel is a ×', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await user.click(screen.getByTestId(chatTestIds.fab));
    const collapse = screen.getByTestId(chatTestIds.collapse);
    expect(collapse).toHaveAccessibleName('Collapse chat');
    expect(collapse).toHaveAttribute('aria-expanded', 'true');
    expect(collapse).toHaveAttribute('aria-controls', screen.getByTestId(chatTestIds.panel).id);

    await user.click(screen.getByTestId(chatTestIds.voiceCall));
    expect(screen.getAllByTestId(chatTestIds.collapse)).toHaveLength(1);
    expect(screen.getByTestId(chatTestIds.collapse)).toHaveAccessibleName(
      'Collapse chat. The call goes on.',
    );
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('Esc collapses in every view and never ends the call, also while connecting', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await startCall(user);
    await waitFor(() => expect(client.call).not.toBeNull());
    await user.keyboard('{Escape}');
    const root = screen.getByTestId(chatTestIds.root);
    expect(root).toHaveAttribute('data-surface', 'callPill');
    expect(await screen.findByTestId(chatTestIds.voicePillExpand)).toHaveFocus();

    client.emit({ type: 'status', status: 'live' });
    await user.click(screen.getByTestId(chatTestIds.voicePillExpand));
    await user.click(screen.getByTestId(chatTestIds.voiceChatToggle));
    await user.type(screen.getByTestId(chatTestIds.input), 'draft{Escape}');
    expect(root).toHaveAttribute('data-surface', 'callPill');
    expect(client.call?.ended).toBeNull();

    await user.click(await screen.findByTestId(chatTestIds.voicePillExpand));
    expect(root).toHaveAttribute('data-surface', 'callChat');
    expect(screen.getByTestId(chatTestIds.input)).toHaveValue('draft');
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
