import { screen, waitFor, within } from '@testing-library/react';
import { FakeVoiceClient } from '../../../data/voice';
import { chatTestIds } from '../testIds';
import { ManualVoiceClient, renderVoiceChat } from './voiceTestHarness';

const voiceMode = () => screen.getByTestId(chatTestIds.voiceMode);

describe('voice mode', () => {
  it('shows no mic without a voice client (the flag is off)', async () => {
    await renderVoiceChat({ client: null });
    expect(screen.getByTestId(chatTestIds.fab)).toBeInTheDocument();
    expect(screen.queryByTestId(chatTestIds.voiceMic)).not.toBeInTheDocument();
  });

  it('puts the mic left of the pill and opens a dialog in "connecting"', async () => {
    const { user } = await renderVoiceChat();
    const mic = screen.getByRole('button', { name: 'Talk to my AI by voice' });
    expect(mic.compareDocumentPosition(screen.getByTestId(chatTestIds.fab))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    await user.click(mic);
    const dialog = screen.getByRole('dialog', { name: 'Voice chat with Andrew’s AI' });
    expect(dialog).toHaveAttribute('data-phase', 'connecting');
    expect(dialog).toHaveFocus();
    expect(within(dialog).getByText(/processed by ElevenLabs/)).toBeInTheDocument();
    expect(screen.getByTestId(chatTestIds.voiceMute)).toBeDisabled();
    // The launcher row hides while the voice mode is open.
    expect(screen.queryByTestId(chatTestIds.fab)).not.toBeInTheDocument();
  });

  it('plays a scripted call into the chat: lines, a scroll, then the chat opens', async () => {
    const client = new FakeVoiceClient({ stepMs: 0 });
    const { user, executor } = await renderVoiceChat({ client });
    await user.click(screen.getByTestId(chatTestIds.voiceMic));

    const panel = await screen.findByTestId(chatTestIds.panel, {}, { timeout: 3000 });
    // The voice mode plays its close animation, then leaves.
    await waitFor(() =>
      expect(screen.queryByTestId(chatTestIds.voiceMode)).not.toBeInTheDocument(),
    );
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
  });

  it('shows the caption, mode and timer, and mutes the microphone', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await user.click(screen.getByTestId(chatTestIds.voiceMic));
    await waitFor(() => expect(client.call).not.toBeNull());

    client.emit(
      { type: 'status', status: 'live' },
      { type: 'mode', mode: 'speaking' },
      { type: 'line', line: { id: 'agent-1', role: 'agent', text: 'Hi there.' } },
    );
    expect(voiceMode()).toHaveAttribute('data-phase', 'speaking');
    expect(screen.getByTestId(chatTestIds.voiceStatus)).toHaveTextContent('Speaking');
    expect(screen.getByTestId(chatTestIds.voiceCaption)).toHaveTextContent('Hi there.');
    expect(screen.getByRole('timer')).toHaveAccessibleName('Call time 0:00 of 3:00');
    expect(screen.getByTestId(chatTestIds.voiceAnnouncer)).toHaveTextContent(
      'Connected. Start talking.',
    );

    client.emit({ type: 'mode', mode: 'listening' });
    await user.click(screen.getByRole('button', { name: 'Mute microphone' }));
    expect(client.call?.muted).toBe(true);
    expect(voiceMode()).toHaveAttribute('data-muted', 'true');
    expect(screen.getByTestId(chatTestIds.voiceStatus)).toHaveTextContent('Mic off');
    expect(screen.getByTestId(chatTestIds.voiceCaption)).toHaveTextContent(
      'Your microphone is off. Unmute to talk.',
    );
    const unmute = screen.getByRole('button', { name: 'Unmute microphone' });
    expect(unmute).toHaveAttribute('aria-pressed', 'true');
    await user.click(unmute);
    expect(client.call?.muted).toBe(false);
  });

  it('End with lines closes the voice mode and opens the chat with the transcript', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await user.click(screen.getByTestId(chatTestIds.voiceMic));
    await waitFor(() => expect(client.call).not.toBeNull());
    client.emit(
      { type: 'status', status: 'live' },
      { type: 'line', line: { id: 'visitor-1', role: 'visitor', text: 'Hello?' } },
    );
    await user.click(screen.getByRole('button', { name: 'End call' }));

    expect(client.call?.ended).toBe('visitor');
    const panel = await screen.findByTestId(chatTestIds.panel);
    expect(within(panel).getByText('Hello?')).toBeInTheDocument();
  });

  it('End with no lines just closes and gives the focus back to the mic', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await user.click(screen.getByTestId(chatTestIds.voiceMic));
    await waitFor(() => expect(client.call).not.toBeNull());
    client.emit({ type: 'status', status: 'live' });
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.getByTestId(chatTestIds.voiceMic)).toHaveFocus());
    expect(screen.queryByTestId(chatTestIds.panel)).not.toBeInTheDocument();
  });

  it('Switch to text chat ends the call and opens the chat', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await user.click(screen.getByTestId(chatTestIds.voiceMic));
    await waitFor(() => expect(client.call).not.toBeNull());
    client.emit({ type: 'status', status: 'live' });
    await user.click(screen.getByRole('button', { name: 'Switch to text chat' }));

    expect(client.call?.ended).toBe('visitor');
    expect(await screen.findByTestId(chatTestIds.panel)).toBeInTheDocument();
  });
});
