import { render, screen } from '@testing-library/react';
import { FakeShowRepository } from '../data/retro';
import { chatTestIds } from '../screens/chat/testIds';
import { homeTestIds } from '../screens/home/testIds';
import { App } from './App';
import { AppProviders } from './AppProviders';
import type { RetroMode } from './retroMode';

function renderApp(retroMode: RetroMode) {
  return render(
    <AppProviders locale="en" retroMode={retroMode} showRepository={new FakeShowRepository()}>
      <App />
    </AppProviders>,
  );
}

const stage = () => document.querySelector('[data-retro-stage]');
const layers = () => document.head.querySelectorAll('style[data-retro-layer]');

// The full show over the page comes back with `retro-4` (CV-107 Build split → T6).
describe('App modes', () => {
  // Both modes load the chat as a lazy chunk: imported once up front, a cold import (Vite
  // transforming the chat on demand) can't outlast `findBy`'s 1 s when the machine is busy.
  beforeAll(() => import('../screens/chat/ChatRoute'));

  it('normal mode: no stage, and the AI chat loads at start', async () => {
    renderApp('normal');
    expect(await screen.findByTestId(chatTestIds.fab)).toBeInTheDocument();
    expect(stage()).toBeNull();
    expect(layers()).toHaveLength(0);
  });

  it('show mode while the page has no show: the normal page with the AI chat', async () => {
    renderApp('show');
    expect(await screen.findByTestId(chatTestIds.fab)).toBeInTheDocument();
    expect(screen.getByTestId(homeTestIds.name)).toBeVisible();
    expect(stage()).toBeNull();
    expect(layers()).toHaveLength(0);
  });
});
