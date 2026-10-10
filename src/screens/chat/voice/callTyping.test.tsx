import { screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { afterEach, vi } from 'vitest';
import { FakeChatRepository } from '../../../data/chat';
import { answer } from '../chatTestHarness';
import { chatTestIds } from '../testIds';
import { ManualVoiceClient, renderVoiceChat, startCall, stubLayout } from './voiceTestHarness';

// docs/voice/SYSTEM_DESIGN.md §4.4 and §12 "Screen (typing in a call)": one composer, two
// destinations, decided by the call at the moment of sending.
const surface = () => screen.getByTestId(chatTestIds.root).getAttribute('data-surface');
const panel = () => within(screen.getByTestId(chatTestIds.voicePanel));
const chatPanel = () => within(screen.getByTestId(chatTestIds.panel));
const AGENT = { type: 'line', line: { id: 'agent-1', role: 'agent', text: 'Hi there.' } } as const;

async function dial(user: UserEvent, client: ManualVoiceClient) {
  await startCall(user);
  await waitFor(() => expect(client.call).not.toBeNull());
}

async function liveCall(user: UserEvent, client: ManualVoiceClient) {
  await dial(user, client);
  client.emit({ type: 'status', status: 'live' }, AGENT);
}

describe('typing during a call', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('live: Send goes to the agent, shows at once as the caption and a chat row, clears the field', async () => {
    const client = new ManualVoiceClient();
    const chat = new FakeChatRepository();
    const { user } = await renderVoiceChat({ client, chat });
    await liveCall(user, client);

    const input = panel().getByTestId(chatTestIds.input);
    expect(input).toHaveAttribute('placeholder', 'Type a message…');
    await user.type(input, 'Does he know Kotlin?{Enter}');

    expect(client.call?.sentTexts).toEqual(['Does he know Kotlin?']);
    expect(panel().getByTestId(chatTestIds.voiceCaption)).toHaveTextContent('Does he know Kotlin?');
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(chat.requests).toHaveLength(0);

    await user.click(screen.getByTestId(chatTestIds.voiceChatToggle));
    const list = within(screen.getByTestId(chatTestIds.list));
    expect(list.getByTestId(chatTestIds.visitorMessage)).toHaveTextContent('Does he know Kotlin?');
  });

  it('connecting: the field is disabled and keeps the draft; Send does nothing', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await user.click(screen.getByTestId(chatTestIds.fab));
    await user.type(screen.getByTestId(chatTestIds.input), 'draft');
    await user.click(screen.getByTestId(chatTestIds.voiceCall));
    await waitFor(() => expect(client.call).not.toBeNull());

    const input = panel().getByTestId(chatTestIds.input);
    expect(input).toBeDisabled();
    expect(input).toHaveValue('draft');
    expect(panel().getByTestId(chatTestIds.voiceMute)).toBeDisabled();
    expect(panel().getByTestId(chatTestIds.send)).toBeDisabled();

    client.emit({ type: 'status', status: 'live' });
    expect(input).toBeEnabled();
    expect(input).toHaveValue('draft');
  });

  it('typing() reaches the agent only while the call is live', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await liveCall(user, client);
    await user.type(panel().getByTestId(chatTestIds.input), 'abc');
    const call = client.call;
    expect(call?.typings).toBe(3);

    await user.click(panel().getByTestId(chatTestIds.voiceEnd));
    await waitFor(() => expect(surface()).toBe('text'));
    await user.type(chatPanel().getByTestId(chatTestIds.input), 'de');
    expect(call?.typings).toBe(3);
  });

  it('the call ends mid-typing: the text stays, and Send asks /api/chat with the call', async () => {
    const client = new ManualVoiceClient();
    const chat = new FakeChatRepository();
    const { user } = await renderVoiceChat({ client, chat });
    await liveCall(user, client);
    await user.type(panel().getByTestId(chatTestIds.input), 'Typed line{Enter}');
    await user.click(screen.getByTestId(chatTestIds.voiceChatToggle));
    await user.type(chatPanel().getByTestId(chatTestIds.input), 'And after?');
    client.emit({ type: 'ended', reason: 'agent' });

    expect(surface()).toBe('text');
    const input = chatPanel().getByTestId(chatTestIds.input);
    expect(input).toHaveValue('And after?');
    expect(input).toHaveAttribute('placeholder', '…or type instead');
    await user.type(input, '{Enter}');

    expect(client.call?.sentTexts).toEqual(['Typed line']);
    expect(chat.requests).toHaveLength(1);
    const question = chat.requests[0]?.messages.at(-1);
    expect(question).toMatchObject({ role: 'user', content: 'And after?' });
    const lines = question && 'voiceCalls' in question ? question.voiceCalls?.[0]?.lines : [];
    expect(lines).toEqual([
      { role: 'agent', text: 'Hi there.' },
      { role: 'visitor', text: 'Typed line' },
    ]);
  });

  it('a typed line is a call line, not a question: a call with only typed lines opens the chat', async () => {
    const client = new ManualVoiceClient();
    const chat = new FakeChatRepository();
    const { user } = await renderVoiceChat({ client, chat });
    await dial(user, client);
    client.emit({ type: 'status', status: 'live' });
    await user.type(panel().getByTestId(chatTestIds.input), 'Only typed{Enter}');
    await user.click(panel().getByTestId(chatTestIds.voiceEnd));

    expect(surface()).toBe('text');
    const list = within(screen.getByTestId(chatTestIds.list));
    expect(list.getByTestId(chatTestIds.visitorMessage)).toHaveTextContent('Only typed');
    expect(list.getAllByTestId(chatTestIds.voiceDivider)).toHaveLength(2);
    expect(chat.requests).toHaveLength(0);
  });

  it('a full conversation doesn’t block a typed call line (it isn’t a question)', async () => {
    const client = new ManualVoiceClient();
    const chat = new FakeChatRepository();
    const { user } = await renderVoiceChat({ client, chat });
    await user.click(screen.getByTestId(chatTestIds.fab));
    const input = screen.getByTestId(chatTestIds.input);
    for (let i = 1; i <= 10; i++) {
      chat.reply(...answer(`Answer ${i}`));
      await user.type(input, `Question ${i}{Enter}`);
      await within(screen.getByTestId(chatTestIds.list)).findByText(`Answer ${i}`);
    }
    await user.type(input, 'One more');
    expect(screen.getByTestId(chatTestIds.send)).toBeDisabled();
    await user.clear(input);

    await user.click(screen.getByTestId(chatTestIds.voiceCall));
    await waitFor(() => expect(client.call).not.toBeNull());
    client.emit({ type: 'status', status: 'live' });
    await user.type(panel().getByTestId(chatTestIds.input), 'Typed anyway{Enter}');
    expect(client.call?.sentTexts).toEqual(['Typed anyway']);
    expect(chat.requests).toHaveLength(10);
  });

  it('on a phone, the call sheet’s field types to the call without leaving the orb view', async () => {
    stubLayout('sheet');
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await liveCall(user, client);
    const input = panel().getByTestId(chatTestIds.input);
    await user.click(input);
    await user.keyboard('Hello{Enter}');

    expect(surface()).toBe('call');
    expect(input).toHaveFocus();
    expect(client.call?.sentTexts).toEqual(['Hello']);
  });
});
