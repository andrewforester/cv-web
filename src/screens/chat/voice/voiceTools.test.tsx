import { act, screen, waitFor, within } from '@testing-library/react';
import { chatTestIds } from '../testIds';
import { CONTACT_TAP_MS, FOG_HOLD_MS } from './useVoiceTools';
import { ManualVoiceClient, renderVoiceChat } from './voiceTestHarness';

const voiceMode = () => screen.getByTestId(chatTestIds.voiceMode);
const linkedin = { name: 'openContact', input: { channel: 'linkedin' } } as const;

async function liveCall(options: { advanceTimers?: (ms: number) => void } = {}) {
  const client = new ManualVoiceClient();
  const rendered = await renderVoiceChat({ client, ...options });
  await rendered.user.click(screen.getByTestId(chatTestIds.voiceMic));
  await waitFor(() => expect(client.call).not.toBeNull());
  client.emit({ type: 'status', status: 'live' }, { type: 'mode', mode: 'speaking' });
  return { ...rendered, client };
}

describe('voice page tools', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('a scroll parts the fog with a chip until the agent’s turn ends, 3 s at least', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { client, executor } = await liveCall({
      advanceTimers: (ms) => vi.advanceTimersByTime(ms),
    });
    const result = await act(() =>
      client.tool({ name: 'scrollToSection', input: { section: 'experience' } }),
    );
    expect(result).toEqual({ ok: true });
    expect(executor.executed).toHaveLength(1);
    expect(voiceMode()).toHaveAttribute('data-phase', 'tool');
    expect(screen.getByTestId(chatTestIds.voiceAction)).toHaveTextContent('Scrolled to Experience');

    client.emit({ type: 'mode', mode: 'listening' });
    expect(voiceMode()).toHaveAttribute('data-phase', 'tool');
    act(() => vi.advanceTimersByTime(FOG_HOLD_MS));
    expect(voiceMode()).toHaveAttribute('data-phase', 'listening');
    expect(screen.queryByTestId(chatTestIds.voiceAction)).not.toBeInTheDocument();
  });

  it('a tool the page doesn’t have is answered "not available"', async () => {
    const { client, executor } = await liveCall();
    executor.results.highlightElement = { ok: false, error: 'not_available' };
    const result = await act(() =>
      client.tool({ name: 'highlightElement', input: { target: 'experience:transcenda' } }),
    );
    expect(result).toEqual({ ok: false, error: 'not_available' });
    expect(screen.getByTestId(chatTestIds.voiceAction)).toHaveTextContent(
      'That isn’t available on this page.',
    );
  });

  it('openContact opens the contact at once when the browser allows a new tab', async () => {
    const opened = { opener: window } as unknown as Window;
    const open = vi.spyOn(window, 'open').mockReturnValue(opened);
    const { client } = await liveCall();
    const result = await act(() => client.tool(linkedin));

    expect(result).toEqual({ ok: true });
    expect(open).toHaveBeenCalledWith(expect.stringContaining('linkedin.com'), '_blank');
    expect(opened.opener).toBeNull();
    expect(screen.queryByTestId(chatTestIds.voiceContact)).not.toBeInTheDocument();
    expect(screen.getByTestId(chatTestIds.voiceAction)).toHaveTextContent('Opened LinkedIn');
  });

  it('a blocked new tab shows the card; tapping Open answers ok', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    const { client, user } = await liveCall();
    const pending = client.tool(linkedin);

    const card = await screen.findByTestId(chatTestIds.voiceContact);
    expect(voiceMode()).toHaveAttribute('data-phase', 'contact');
    expect(card).toHaveTextContent('Open Andrew’s LinkedIn profile?');
    const link = within(card).getByRole('link', { name: 'Open LinkedIn' });
    expect(link).toHaveFocus();
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    link.addEventListener('click', (event) => event.preventDefault());
    await user.click(link);

    expect(await pending).toEqual({ ok: true });
    expect(screen.queryByTestId(chatTestIds.voiceContact)).not.toBeInTheDocument();
  });

  it('Cancel on the card, or 30 s without a tap, answers "declined"', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.spyOn(window, 'open').mockReturnValue(null);
    const { client, user } = await liveCall({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });

    const cancelled = client.tool(linkedin, 'voice-1');
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(await cancelled).toEqual({ ok: false, error: 'declined' });
    expect(screen.getByTestId(chatTestIds.voiceAction)).toHaveTextContent('Cancelled');

    const timedOut = client.tool(linkedin, 'voice-2');
    await screen.findByTestId(chatTestIds.voiceContact);
    act(() => vi.advanceTimersByTime(CONTACT_TAP_MS));
    expect(await timedOut).toEqual({ ok: false, error: 'declined' });
  });

  it('ending the call while the card waits declines it, in the chat too', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    const { client, user } = await liveCall();
    const pending = client.tool(linkedin);
    await screen.findByTestId(chatTestIds.voiceContact);
    await user.click(screen.getByRole('button', { name: 'End call' }));

    expect(await pending).toEqual({ ok: false, error: 'declined' });
    // No lines were said, so the chat stays closed: open it to read the call.
    await user.click(await screen.findByTestId(chatTestIds.fab));
    const list = within(await screen.findByTestId(chatTestIds.list));
    expect(list.getByTestId(chatTestIds.actionChip)).toHaveTextContent('Cancelled');
  });

  it('email goes through the page’s own tool (mailto: opens in place)', async () => {
    const open = vi.spyOn(window, 'open');
    const { client, executor } = await liveCall();
    const result = await act(() =>
      client.tool({ name: 'openContact', input: { channel: 'email' } }),
    );
    expect(result).toEqual({ ok: true });
    expect(open).not.toHaveBeenCalled();
    expect(executor.executed).toEqual([
      { id: 'voice-1', name: 'openContact', input: { channel: 'email' } },
    ]);
  });
});
