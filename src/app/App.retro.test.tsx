import { act, render, screen } from '@testing-library/react';
import { FakeShowRepository } from '../data/retro';
import { chatTestIds } from '../screens/chat/testIds';
import { homeTestIds } from '../screens/home/testIds';
import { App } from './App';
import { AppProviders } from './AppProviders';
import type { RetroMode } from './retroMode';

function renderApp(retroMode: RetroMode) {
  return render(
    <AppProviders retroMode={retroMode} showRepository={new FakeShowRepository()}>
      <App />
    </AppProviders>,
  );
}

const stage = () => document.querySelector('[data-retro-stage]');
const layers = () => document.head.querySelectorAll('style[data-retro-layer]');

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

  // Plays the whole ~91 s show frame by frame: CPU-bound (10x slower when other test runs share
  // the machine), so far above the 5 s default.
  describe('show mode', { timeout: 60_000 }, () => {
    beforeEach(() => {
      vi.useFakeTimers();
      // jsdom doesn't scroll; the shell scrolls to the top when the show starts.
      vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    });
    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    /** Moves the fake clock in frames so the runner re-arms its timer after every render. */
    async function advance(ms: number, frame = 50) {
      for (let done = 0; done < ms; done += frame) {
        await act(() => vi.advanceTimersByTimeAsync(frame));
      }
    }

    it('runs retro-4 over the same page, then leaves the normal site with the AI chat', async () => {
      // The show is a lazy chunk; loaded here first, the shell's import resolves within a frame.
      await import('../screens/retro/RetroShowRoute');
      renderApp('show');
      await advance(50);
      const name = screen.getByTestId(homeTestIds.name);
      expect(stage()).not.toBeNull();
      expect(layers()).toHaveLength(32);
      expect(screen.queryByTestId(chatTestIds.fab)).toBeNull();

      // Nobody looks at the frames in between, so they are long: fewer renders on a busy machine.
      await advance(110_000, 250);

      expect(stage()).toBeNull();
      expect(layers()).toHaveLength(0);
      expect(screen.getByTestId(chatTestIds.fab)).toBeInTheDocument();
      expect(screen.getByTestId(homeTestIds.name)).toBe(name);
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
    });
  });
});
