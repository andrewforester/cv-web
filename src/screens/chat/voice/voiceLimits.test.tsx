import { act, screen, waitFor, within } from '@testing-library/react';
import { chatTestIds } from '../testIds';
import { WRAP_UP_UPDATE } from './useVoiceTimer';
import {
  ManualVoiceClient,
  renderVoiceChat,
  sessionError,
  startCall,
  StubSessionRepository,
} from './voiceTestHarness';

const errorCard = () => screen.getByTestId(chatTestIds.voiceError);

async function callWith(client = new ManualVoiceClient(), sessions = new StubSessionRepository()) {
  const rendered = await renderVoiceChat({ client, sessions });
  await startCall(rendered.user);
  return { ...rendered, client };
}

describe('call errors and limits', () => {
  it.each([
    ['rate_limited', 'rateLimited', 'Too many calls'],
    ['quota_exhausted', 'quotaExhausted', 'Voice is resting this month'],
    ['unavailable', 'unavailable', 'Couldn’t start the call'],
    ['upstream_error', 'unavailable', 'Couldn’t start the call'],
    ['unsupported_version', 'unsupportedVersion', 'Voice was updated'],
  ] as const)('a %s session shows the %s card', async (code, kind, title) => {
    const sessions = new StubSessionRepository(sessionError(code));
    const { client } = await callWith(new ManualVoiceClient(), sessions);
    expect(await screen.findByRole('alert')).toHaveAttribute('data-error', kind);
    expect(errorCard()).toHaveTextContent(title);
    expect(screen.getByTestId(chatTestIds.voicePanel)).toHaveAttribute('data-phase', 'error');
    expect(client.call).toBeNull();
    // Errors replace the timer with close and drop the controls.
    expect(screen.getByRole('button', { name: 'Close voice chat' })).toBeInTheDocument();
    expect(screen.queryByTestId(chatTestIds.voiceEnd)).not.toBeInTheDocument();
  });

  it('a blocked microphone asks for no token and offers to type instead', async () => {
    const client = new ManualVoiceClient();
    client.microphone = 'denied';
    const sessions = new StubSessionRepository();
    const { user } = await callWith(client, sessions);
    expect(await screen.findByRole('alert')).toHaveAttribute('data-error', 'micDenied');
    expect(sessions.requests).toBe(0);

    await user.click(screen.getByRole('button', { name: 'Type instead' }));
    expect(await screen.findByTestId(chatTestIds.panel)).toBeInTheDocument();
  });

  it('offline at the tap shows the offline card; Try again calls again', async () => {
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const sessions = new StubSessionRepository();
    const { user } = await callWith(new ManualVoiceClient(), sessions);
    expect(await screen.findByRole('alert')).toHaveAttribute('data-error', 'offline');
    expect(sessions.requests).toBe(0);

    online.mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(sessions.requests).toBe(1));
    online.mockRestore();
  });

  it('a start that fails after the token reads as "busy"', async () => {
    const client = new ManualVoiceClient();
    client.failStart = true;
    await callWith(client);
    expect(await screen.findByRole('alert')).toHaveAttribute('data-error', 'busy');
    expect(errorCard()).toHaveTextContent('The line is busy');
  });

  it('a call that fails mid-way shows "dropped" and keeps what was said', async () => {
    const { client, user } = await callWith();
    await waitFor(() => expect(client.call).not.toBeNull());
    client.emit(
      { type: 'status', status: 'live' },
      { type: 'line', line: { id: 'agent-1', role: 'agent', text: 'Hi.' } },
      { type: 'ended', reason: 'error' },
    );
    expect(await screen.findByRole('alert')).toHaveAttribute('data-error', 'dropped');

    await user.click(screen.getByRole('button', { name: 'Open chat' }));
    const list = within(await screen.findByTestId(chatTestIds.list));
    expect(list.getByText('Hi.')).toBeInTheDocument();
    expect(list.getAllByTestId(chatTestIds.voiceDivider).at(-1)).toHaveTextContent(
      'Call dropped · 0:00',
    );
  });

  it('going offline mid-call ends it as dropped', async () => {
    const { client } = await callWith();
    await waitFor(() => expect(client.call).not.toBeNull());
    client.emit({ type: 'status', status: 'live' });
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(client.call?.ended).toBe('visitor');
    expect(await screen.findByRole('alert')).toHaveAttribute('data-error', 'dropped');
    online.mockRestore();
  });

  it('going offline while connecting shows the offline card', async () => {
    const sessions = new StubSessionRepository();
    sessions.create = () => new Promise(() => undefined);
    await callWith(new ManualVoiceClient(), sessions);
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(await screen.findByRole('alert')).toHaveAttribute('data-error', 'offline');
    online.mockRestore();
  });

  it('Reload page reloads on the "Voice was updated" card; Close closes it', async () => {
    const sessions = new StubSessionRepository(sessionError('unsupported_version'));
    const reload = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, reload });
    const { user } = await callWith(new ManualVoiceClient(), sessions);
    await user.click(await screen.findByRole('button', { name: 'Reload page' }));
    expect(reload).toHaveBeenCalled();
    vi.restoreAllMocks();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.getByTestId(chatTestIds.voiceCall)).toHaveFocus());
  });
});

describe('voice call timer', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it('tells the agent to wrap up at 2:30 and ends the call at 3:00', async () => {
    const client = new ManualVoiceClient();
    const sessions = new StubSessionRepository();
    const { user } = await renderVoiceChat({
      client,
      sessions,
      advanceTimers: (ms) => vi.advanceTimersByTime(ms),
    });
    await startCall(user);
    await waitFor(() => expect(client.call).not.toBeNull());
    client.emit({ type: 'status', status: 'live' }, { type: 'mode', mode: 'listening' });

    act(() => vi.advanceTimersByTime(150_000));
    expect(client.call?.contextualUpdates).toEqual([WRAP_UP_UPDATE]);
    expect(screen.getByTestId(chatTestIds.voiceAnnouncer)).toHaveTextContent('30 seconds left.');
    expect(screen.getByTestId(chatTestIds.voiceTimer)).toHaveTextContent('0:30 left');

    act(() => vi.advanceTimersByTime(30_000));
    expect(client.call?.ended).toBe('time_limit');
    expect(await screen.findByRole('alert')).toHaveAttribute('data-error', 'timeLimit');
    expect(client.call?.contextualUpdates).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Open chat' }));
    const list = within(await screen.findByTestId(chatTestIds.list));
    expect(list.getAllByTestId(chatTestIds.voiceDivider).at(-1)).toHaveTextContent(
      'Call ended at the 3-minute limit',
    );
  });
});
