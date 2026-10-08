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
});
