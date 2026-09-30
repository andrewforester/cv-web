import { act, render, screen } from '@testing-library/react';
import { FakeShowRepository } from '../data/retro';
import { chatTestIds } from '../screens/chat/testIds';
import { cvTestIds } from '../screens/cv/testIds';
import { App } from './App';
import { AppProviders } from './AppProviders';
import { RETRO_DONE_KEY, type RetroMode } from './retroMode';

function renderApp(retroMode: RetroMode) {
  return render(
    <AppProviders locale="en" retroMode={retroMode} showRepository={new FakeShowRepository()}>
      <App />
    </AppProviders>,
  );
}

const stage = () => document.querySelector('[data-retro-stage]');
const layers = () => document.head.querySelectorAll('style[data-retro-layer]');

describe('App modes', () => {
  afterEach(() => sessionStorage.clear());

  it('normal mode: no stage, and the AI chat loads at start', async () => {
    renderApp('normal');
    expect(await screen.findByTestId(chatTestIds.fab)).toBeInTheDocument();
    expect(stage()).toBeNull();
    expect(layers()).toHaveLength(0);
    expect(screen.getByTestId('app-header')).toBeVisible();
  });

  describe('show mode', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    /** Moves the fake clock in frames so the runner re-arms its timer after every render. */
    async function advance(ms: number) {
      for (let done = 0; done < ms; done += 50) {
        await act(() => vi.advanceTimersByTimeAsync(50));
      }
    }

    it('runs the show over the same CV, then leaves the normal site with the AI chat', async () => {
      // The show is a lazy chunk; loaded here first, the shell's import resolves within a frame.
      await import('../screens/retro/RetroShowRoute');
      renderApp('show');
      await advance(50);
      const name = screen.getByTestId(cvTestIds.name);
      expect(stage()).not.toBeNull();
      expect(layers().length).toBeGreaterThan(0);
      expect(screen.queryByTestId(chatTestIds.fab)).toBeNull();

      await advance(80_000);

      expect(stage()).toBeNull();
      expect(layers()).toHaveLength(0);
      expect(screen.getByTestId(chatTestIds.fab)).toBeInTheDocument();
      expect(screen.getByTestId(cvTestIds.name)).toBe(name);
      expect(sessionStorage.getItem(RETRO_DONE_KEY)).toBe('1');
    });
  });
});
