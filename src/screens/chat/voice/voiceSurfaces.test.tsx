import { act, screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { afterEach, vi } from 'vitest';
import type { ChatDock } from '../chatDock';
import { chatTestIds } from '../testIds';
import { ENDED_PILL_MS } from '../useChatSurface';
import { ManualVoiceClient, renderVoiceChat, stubLayout } from './voiceTestHarness';

// docs/voice/SYSTEM_DESIGN.md §4.2–4.3: what the chat shows during and after a call.
const surface = () => screen.getByTestId(chatTestIds.root).getAttribute('data-surface');
const LINE = { type: 'line', line: { id: 'visitor-1', role: 'visitor', text: 'Hello?' } } as const;

async function liveCall(user: UserEvent, client: ManualVoiceClient, mic = chatTestIds.voiceMic) {
  await user.click(screen.getByTestId(mic));
  await waitFor(() => expect(client.call).not.toBeNull());
  client.emit({ type: 'status', status: 'live' });
}

describe('call surfaces', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    history.replaceState(null, '', '/');
  });

  it('Show chat opens the read-only chat with the call’s lines; Hide chat goes back', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await liveCall(user, client);
    client.emit(LINE);
    await user.click(screen.getByTestId(chatTestIds.voiceShowChat));

    expect(surface()).toBe('callChat');
    const chat = screen.getByTestId(chatTestIds.panel);
    expect(within(chat).getByText('Hello?')).toBeInTheDocument();
    expect(within(chat).getByTestId(chatTestIds.voiceCallbar)).toHaveTextContent(
      'Read-only during the call. End it to type.',
    );
    expect(within(chat).queryByTestId(chatTestIds.input)).not.toBeInTheDocument();
    expect(within(chat).queryByTestId(chatTestIds.suggestion)).not.toBeInTheDocument();

    await user.click(screen.getByTestId(chatTestIds.voiceHideChat));
    expect(surface()).toBe('call');
    expect(await screen.findByTestId(chatTestIds.voicePanel)).toHaveFocus();
  });

  it('End in the call bar lands in the text chat with the typed text kept and focused', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await user.click(screen.getByTestId(chatTestIds.fab));
    await user.type(screen.getByTestId(chatTestIds.input), 'draft');
    await liveCall(user, client, chatTestIds.voiceComposerMic);
    client.emit(LINE);
    await user.click(screen.getByTestId(chatTestIds.voiceShowChat));
    await user.click(screen.getByTestId(chatTestIds.voiceCallbarEnd));

    expect(client.call?.ended).toBe('visitor');
    expect(surface()).toBe('text');
    const input = await screen.findByTestId(chatTestIds.input);
    expect(input).toHaveValue('draft');
    await waitFor(() => expect(input).toHaveFocus());
  });

  it('minimize folds the call into the pill; the pill unfolds to the view it had', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await liveCall(user, client);
    await user.click(screen.getByTestId(chatTestIds.voiceShowChat));
    const chat = within(screen.getByTestId(chatTestIds.panel));
    await user.click(chat.getByTestId(chatTestIds.voiceMinimize));

    expect(surface()).toBe('callPill');
    const expand = await screen.findByTestId(chatTestIds.voicePillExpand);
    expect(expand).toHaveFocus();
    expect(expand).toHaveAccessibleName('Open the call panel: Listening 0:00');
    expect(screen.queryByTestId(chatTestIds.fab)).not.toBeInTheDocument();

    await user.click(expand);
    expect(surface()).toBe('callChat');
  });

  it('a call that ends while folded says how on the pill, then the launcher returns', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client, advanceTimers: vi.advanceTimersByTime });
    await liveCall(user, client);
    client.emit(LINE);
    await user.click(screen.getByTestId(chatTestIds.voiceMinimize));
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
    await user.click(screen.getByTestId(chatTestIds.voiceMinimize));
    vi.stubGlobal('open', () => null);
    void client.tool({ name: 'openContact', input: { channel: 'whatsapp' } });

    expect(await screen.findByTestId(chatTestIds.voiceContact)).toBeInTheDocument();
    expect(surface()).toBe('call');
  });

  it('reports the dock: the column beside the page, nothing when folded', async () => {
    stubLayout('column');
    const docks: ChatDock[] = [];
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client, onDockChange: (dock) => docks.push(dock) });
    await liveCall(user, client);
    expect(docks.at(-1)).toBe('side');
    // Docked, the chat is a region beside the page, not a modal dialog.
    await user.click(screen.getByTestId(chatTestIds.voiceShowChat));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const chat = within(screen.getByTestId(chatTestIds.panel));
    await user.click(chat.getByTestId(chatTestIds.voiceMinimize));
    expect(docks.at(-1)).toBe('none');
  });

  it('on a phone: a bottom sheet (dock `bottom`), and Back steps out one view at a time', async () => {
    stubLayout('sheet');
    const docks: ChatDock[] = [];
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client, onDockChange: (dock) => docks.push(dock) });
    await liveCall(user, client);
    expect(docks.at(-1)).toBe('bottom');
    await user.click(screen.getByTestId(chatTestIds.voiceShowChat));
    expect(docks.at(-1)).toBe('none');

    act(() => history.back());
    await waitFor(() => expect(surface()).toBe('call'));
    act(() => history.back());
    await waitFor(() => expect(surface()).toBe('callPill'));
    expect(client.call?.ended).toBeNull();
  });
});
