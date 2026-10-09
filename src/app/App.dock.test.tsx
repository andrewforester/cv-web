import { act, render, screen } from '@testing-library/react';
import type { ChatRouteProps } from '../screens/chat/chatDock';
import { App } from './App';
import { AppProviders } from './AppProviders';

let report: ChatRouteProps['onDockChange'];

vi.mock('../screens/chat/ChatRoute', () => ({
  ChatRoute: ({ onDockChange }: ChatRouteProps) => {
    report = onDockChange;
    return <div data-testid="chat" />;
  },
}));

const dockAttribute = () => document.documentElement.dataset.chatDock;

describe('App dock', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  it('mirrors the dock the chat reports on <html> and clears it on unmount', async () => {
    const { unmount } = render(
      <AppProviders>
        <App />
      </AppProviders>,
    );
    await screen.findByTestId('chat');
    expect(dockAttribute()).toBe('none');

    act(() => report?.('side'));
    expect(dockAttribute()).toBe('side');
    act(() => report?.('bottom'));
    expect(dockAttribute()).toBe('bottom');
    act(() => report?.('none'));
    expect(dockAttribute()).toBe('none');

    unmount();
    expect(dockAttribute()).toBeUndefined();
  });

  it('changes the attribute in one step, so the slide transitions from the old dock', async () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );
    await screen.findByTestId('chat');
    const changes: (string | null)[] = [];
    const observer = new MutationObserver((records) =>
      records.forEach((r) => changes.push(r.oldValue)),
    );
    observer.observe(document.documentElement, {
      attributeFilter: ['data-chat-dock'],
      attributeOldValue: true,
    });

    act(() => report?.('side'));
    act(() => report?.('none'));
    await Promise.resolve();
    observer.disconnect();
    expect(changes).toEqual(['none', 'side']);
  });
});
