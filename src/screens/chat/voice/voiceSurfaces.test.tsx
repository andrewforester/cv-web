import { act, screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { afterEach, vi } from 'vitest';
import { FakeChatRepository } from '../../../data/chat';
import { EARLIER_CONVERSATION_UNFINISHED_LABEL } from '../../../data/voice';
import type { ChatDock } from '../chatDock';
import { chatTestIds } from '../testIds';
import { ENDED_PILL_MS } from '../useChatSurface';
import { ManualVoiceClient, renderVoiceChat, startCall, stubLayout } from './voiceTestHarness';

// docs/voice/SYSTEM_DESIGN.md §4.2–4.3: what the chat shows during and after a call.
const surface = () => screen.getByTestId(chatTestIds.root).getAttribute('data-surface');
const LINE = { type: 'line', line: { id: 'visitor-1', role: 'visitor', text: 'Hello?' } } as const;

const toggle = () => screen.getByTestId(chatTestIds.voiceChatToggle);

/** Call from the open chat (`open`: the chat is already open), then the call goes live. */
async function liveCall(user: UserEvent, client: ManualVoiceClient, open = false) {
  if (open) await user.click(screen.getByTestId(chatTestIds.voiceCall));
  else await startCall(user);
  await waitFor(() => expect(client.call).not.toBeNull());
  client.emit({ type: 'status', status: 'live' });
}

describe('call surfaces', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    history.replaceState(null, '', '/');
  });

  it('the one toggle: Show chat opens the chat with the call’s lines, Hide chat goes back', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await liveCall(user, client);
    client.emit(LINE);
    expect(toggle()).toHaveAccessibleName('Show chat');
    await user.type(
      within(screen.getByTestId(chatTestIds.voicePanel)).getByTestId(chatTestIds.input),
      'draft',
    );
    await user.click(toggle());

    expect(surface()).toBe('callChat');
    const chat = screen.getByTestId(chatTestIds.panel);
    expect(within(chat).getByText('Hello?')).toBeInTheDocument();
    const input = within(chat).getByTestId(chatTestIds.input);
    expect(input).toBeEnabled();
    expect(input).toHaveAttribute('placeholder', 'Type a message…');
    expect(input).toHaveAccessibleName('Message to the call. The AI answers by voice.');
    expect(within(chat).getByTestId(chatTestIds.voiceEnd)).toHaveAccessibleName('End call');
    expect(within(chat).getByTestId(chatTestIds.voiceMute)).toBeEnabled();
    expect(within(chat).getByTestId(chatTestIds.meta)).toHaveTextContent('AI can make mistakes.');
    expect(within(chat).queryByTestId(chatTestIds.suggestion)).not.toBeInTheDocument();
    // Same slot, new label; the focus stays on it; one draft for both views.
    const hide = within(chat).getByTestId(chatTestIds.voiceChatToggle);
    expect(hide).toHaveAccessibleName('Hide chat');
    await waitFor(() => expect(hide).toHaveFocus());
    expect(input).toHaveValue('draft');

    await user.click(hide);
    expect(surface()).toBe('call');
    const panel = await screen.findByTestId(chatTestIds.voicePanel);
    const show = within(panel).getByTestId(chatTestIds.voiceChatToggle);
    expect(show).toHaveAccessibleName('Show chat');
    await waitFor(() => expect(show).toHaveFocus());
    expect(within(panel).getByTestId(chatTestIds.input)).toHaveValue('draft');
  });

  it('End in the chat during the call lands in the text chat with the draft kept and focused', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await user.click(screen.getByTestId(chatTestIds.fab));
    await user.type(screen.getByTestId(chatTestIds.input), 'draft');
    await liveCall(user, client, true);
    client.emit(LINE);
    await user.click(screen.getByTestId(chatTestIds.voiceChatToggle));
    await user.click(
      within(screen.getByTestId(chatTestIds.panel)).getByTestId(chatTestIds.voiceEnd),
    );

    expect(client.call?.ended).toBe('visitor');
    expect(surface()).toBe('text');
    const input = await screen.findByTestId(chatTestIds.input);
    expect(input).toHaveValue('draft');
    await waitFor(() => expect(input).toHaveFocus());
  });

  it('collapse folds the call into the pill; the pill unfolds to the view it had', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await liveCall(user, client);
    await user.click(screen.getByTestId(chatTestIds.voiceChatToggle));
    const chat = within(screen.getByTestId(chatTestIds.panel));
    await user.click(chat.getByTestId(chatTestIds.collapse));

    expect(surface()).toBe('callPill');
    const expand = await screen.findByTestId(chatTestIds.voicePillExpand);
    expect(expand).toHaveFocus();
    expect(expand).toHaveAccessibleName('Open the call panel: Listening 0:00');
    await waitFor(() => expect(screen.queryByTestId(chatTestIds.fab)).not.toBeInTheDocument());

    await user.click(expand);
    expect(surface()).toBe('callChat');
  });

  it('collapse while connecting: the pill says Connecting… until live, then status and time', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await startCall(user);
    const collapse = screen.getByTestId(chatTestIds.collapse);
    expect(collapse).toBeEnabled();
    expect(collapse).toHaveAccessibleName('Collapse chat. The call goes on.');
    await user.click(collapse);

    expect(surface()).toBe('callPill');
    const expand = await screen.findByTestId(chatTestIds.voicePillExpand);
    expect(expand).toHaveAccessibleName('Open the call panel: Connecting…');
    expect(screen.getByTestId(chatTestIds.voicePill)).toHaveAttribute('data-phase', 'connecting');
    await waitFor(() => expect(client.call).not.toBeNull());
    client.emit({ type: 'status', status: 'live' });
    expect(expand).toHaveAccessibleName('Open the call panel: Listening 0:00');
    expect(client.call?.ended).toBeNull();
  });

  it('a start that fails while folded unfolds the panel with its card', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await startCall(user);
    await user.click(screen.getByTestId(chatTestIds.collapse));
    expect(surface()).toBe('callPill');
    await waitFor(() => expect(client.call).not.toBeNull());
    client.emit({ type: 'ended', reason: 'error' });

    expect(surface()).toBe('call');
    const card = await screen.findByTestId(chatTestIds.voiceError);
    expect(card).toHaveAttribute('data-error', 'busy');
    // The card's collapse folds the panel into the launcher: there is no call to keep.
    const collapse = screen.getByTestId(chatTestIds.collapse);
    expect(collapse).toHaveAccessibleName('Collapse chat');
    await user.click(collapse);
    expect(surface()).toBe('closed');
    await waitFor(() => expect(screen.getByTestId(chatTestIds.fab)).toHaveFocus());
  });

  it('End on the connecting pill cancels the attempt and the launcher returns', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await startCall(user);
    await user.click(screen.getByTestId(chatTestIds.collapse));
    await user.click(await screen.findByTestId(chatTestIds.voicePillEnd));

    expect(surface()).toBe('closed');
    await waitFor(() => expect(screen.getByTestId(chatTestIds.fab)).toBeInTheDocument());
    await waitFor(() =>
      expect(screen.queryByTestId(chatTestIds.voicePill)).not.toBeInTheDocument(),
    );
  });

  it('a call that ends while folded says how on the pill, then the launcher returns', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client, advanceTimers: vi.advanceTimersByTime });
    await liveCall(user, client);
    client.emit(LINE);
    await user.click(screen.getByTestId(chatTestIds.collapse));
    await user.click(screen.getByTestId(chatTestIds.voicePillEnd));

    expect(surface()).toBe('closed');
    expect(screen.getByTestId(chatTestIds.voicePill)).toHaveAttribute('data-phase', 'error');
    expect(screen.getByTestId(chatTestIds.voicePillExpand)).toHaveTextContent('Call ended · 0:00');
    expect(screen.queryByTestId(chatTestIds.voicePillEnd)).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(ENDED_PILL_MS + 200));
    await waitFor(() => expect(screen.getByTestId(chatTestIds.fab)).toBeInTheDocument());
    await waitFor(() =>
      expect(screen.queryByTestId(chatTestIds.voicePill)).not.toBeInTheDocument(),
    );
    // The transcript is in the chat the next time it opens.
    await user.click(screen.getByTestId(chatTestIds.fab));
    expect(within(screen.getByTestId(chatTestIds.panel)).getByText('Hello?')).toBeInTheDocument();
  });

  it('a contact card brings the folded call back to its panel', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await liveCall(user, client);
    await user.click(screen.getByTestId(chatTestIds.collapse));
    vi.stubGlobal('open', () => null);
    void client.tool({ name: 'openContact', input: { channel: 'whatsapp' } });

    expect(await screen.findByTestId(chatTestIds.voiceContact)).toBeInTheDocument();
    expect(surface()).toBe('call');
  });

  it('reports the dock: the panel beside the slid page, nothing when folded', async () => {
    stubLayout('slide');
    const docks: ChatDock[] = [];
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client, onDockChange: (dock) => docks.push(dock) });
    await liveCall(user, client);
    expect(docks.at(-1)).toBe('side');
    // Beside the slid page, the chat is a region, not a modal dialog.
    await user.click(screen.getByTestId(chatTestIds.voiceChatToggle));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const chat = within(screen.getByTestId(chatTestIds.panel));
    await user.click(chat.getByTestId(chatTestIds.collapse));
    expect(docks.at(-1)).toBe('none');
  });

  it('on a phone: every view is the one bottom sheet (dock `bottom`), Back is left alone', async () => {
    stubLayout('sheet');
    const docks: ChatDock[] = [];
    const length = history.length;
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client, onDockChange: (dock) => docks.push(dock) });
    await user.click(screen.getByTestId(chatTestIds.fab));
    const sheet = screen.getByTestId(chatTestIds.panel);
    const frame = sheet.className;
    expect(docks.at(-1)).toBe('bottom');

    // Call, Show chat, Hide chat, End: the same element in the same frame, only its middle swaps.
    await liveCall(user, client, true);
    expect(screen.getByTestId(chatTestIds.voicePanel)).toBe(sheet);
    await user.click(toggle());
    expect(surface()).toBe('callChat');
    await user.click(toggle());
    expect(surface()).toBe('call');
    await user.click(screen.getByTestId(chatTestIds.voiceEnd));
    await waitFor(() => expect(surface()).toBe('text'));
    expect(screen.getByTestId(chatTestIds.panel)).toBe(sheet);
    expect(sheet.className).toBe(frame);
    expect(new Set(docks.slice(docks.indexOf('bottom')))).toEqual(new Set(['bottom']));
    // No history entry of its own: the system Back behaves as on any page.
    expect(history.length).toBe(length);
    expect(window.location.hash).toBe('');
  });

  it('Call while an answer streams stops it and hands the unfinished turn to the call', async () => {
    const chat = new FakeChatRepository();
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client, chat });
    await user.click(screen.getByTestId(chatTestIds.fab));
    await user.type(screen.getByTestId(chatTestIds.input), 'What did he build?{Enter}');
    await act(async () => chat.emit({ type: 'delta', text: 'At Transcenda he led' }));
    const call = screen.getByTestId(chatTestIds.voiceCall);
    expect(call).toBeEnabled();

    await user.click(call);
    expect(chat.isStreaming).toBe(false);
    expect(surface()).toBe('call');
    expect(screen.getByTestId(chatTestIds.voicePanel)).toHaveAttribute('data-phase', 'connecting');
    await waitFor(() => expect(client.call).not.toBeNull());
    client.emit({ type: 'status', status: 'live' });
    expect(client.call?.contextualUpdates[0]?.split('\n').slice(-2)).toEqual([
      'Visitor (typed): What did he build?',
      `${EARLIER_CONVERSATION_UNFINISHED_LABEL}At Transcenda he led`,
    ]);

    // What was written stays in the chat, as a stopped answer.
    await user.click(toggle());
    const list = within(screen.getByTestId(chatTestIds.panel));
    expect(list.getByTestId(chatTestIds.assistantMessage)).toHaveTextContent(
      'At Transcenda he led',
    );
    expect(list.getByTestId(chatTestIds.caption)).toHaveTextContent('Answer stopped.');
  });
});
