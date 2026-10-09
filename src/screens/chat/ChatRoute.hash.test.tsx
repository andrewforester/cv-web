import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProviders } from '../../app/AppProviders';
import { FakeChatRepository } from '../../data/chat';
import { ChatRoute } from './ChatRoute';

function renderChat() {
  render(
    <AppProviders chatRepository={new FakeChatRepository()}>
      <ChatRoute />
    </AppProviders>,
  );
}

describe('chat opened by the #ask link', () => {
  afterEach(() => history.replaceState(null, '', '/'));

  it('opens on load with #ask and clears the hash, keeping path and query', () => {
    history.replaceState(null, '', '/new?ref=cv#ask');
    renderChat();

    expect(screen.getByRole('dialog', { name: 'Ask about Andrew' })).toBeInTheDocument();
    expect(window.location.hash).toBe('');
    expect(window.location.pathname + window.location.search).toBe('/new?ref=cv');
  });

  it('opens when the hash changes to #ask, and again after the chat was collapsed', async () => {
    const user = userEvent.setup();
    const followAskLink = () =>
      act(async () => {
        window.location.hash = 'ask';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });
    renderChat();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await followAskLink();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(window.location.hash).toBe('');

    await user.click(screen.getByRole('button', { name: 'Collapse chat' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await followAskLink();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('ignores other hashes', async () => {
    history.replaceState(null, '', '/#experience');
    renderChat();
    await act(async () => window.dispatchEvent(new HashChangeEvent('hashchange')));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(window.location.hash).toBe('#experience');
  });
});
