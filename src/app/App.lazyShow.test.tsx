import { render, screen, waitFor } from '@testing-library/react';
import { FakeShowRepository, SHOW_SCENARIOS, type ShowScenarioId } from '../data/retro';
import { chatTestIds } from '../screens/chat/testIds';
import { homeTestIds } from '../screens/home/testIds';
import type { RetroMode } from './retroMode';

// The show's chunk, replaced per test (vi.doMock + a fresh module registry) so each test controls
// whether and when the shell's `import()` of it resolves.
const SHOW_MODULE = '../screens/retro/RetroShowRoute';
const SHOW_STUB = 'show-stub';
// The page's scenario, replaced per test: the show is off until T6, so the seam runs on a stub.
const SCENARIOS_MODULE = './showScenarios';
const A_SCENARIO = Object.keys(SHOW_SCENARIOS)[0] as ShowScenarioId;

function StubShow() {
  return <div data-testid={SHOW_STUB} />;
}

async function renderApp(
  retroMode: RetroMode,
  showModule: () => Promise<unknown>,
  /** `null`: the page has no show. */
  scenario: ShowScenarioId | null = A_SCENARIO,
) {
  vi.resetModules();
  const importShow = vi.fn(showModule);
  vi.doMock(SHOW_MODULE, importShow);
  vi.doMock(SCENARIOS_MODULE, () => ({ SHOW_SCENARIO: scenario ?? undefined }));
  const { App } = await import('./App');
  const { AppProviders } = await import('./AppProviders');
  render(
    <AppProviders locale="en" retroMode={retroMode} showRepository={new FakeShowRepository()}>
      <App />
    </AppProviders>,
  );
  return importShow;
}

const shell = () => screen.getByRole('main').parentElement;
const stage = () => document.querySelector('[data-retro-stage]');

/** A promise the test settles by hand. */
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((settle) => (resolve = settle));
  return { promise, resolve };
}

describe('App: the show as a lazy chunk', () => {
  // The chat is a lazy chunk too: imported once up front, a cold import (Vite transforming it on
  // demand) can't outlast `findBy`'s 1 s when the machine is busy.
  beforeAll(() => import('../screens/chat/ChatRoute'));
  beforeEach(() => {
    // jsdom doesn't scroll; the shell scrolls to the top when the show starts.
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.doUnmock(SHOW_MODULE);
    vi.doUnmock(SCENARIOS_MODULE);
    vi.restoreAllMocks();
  });

  it('normal mode never requests the show', async () => {
    const importShow = await renderApp('normal', async () => ({ RetroShowRoute: StubShow }));
    expect(await screen.findByTestId(chatTestIds.fab)).toBeInTheDocument();
    expect(importShow).not.toHaveBeenCalled();
    expect(shell()).not.toHaveClass('pending');
  });

  it('show mode on a page without a scenario never requests the show', async () => {
    const importShow = await renderApp('show', async () => ({ RetroShowRoute: StubShow }), null);
    expect(await screen.findByTestId(chatTestIds.fab)).toBeInTheDocument();
    expect(importShow).not.toHaveBeenCalled();
    expect(shell()).not.toHaveClass('pending');
    expect(stage()).toBeNull();
  });

  it('show mode keeps the stage hidden until the show has loaded, then runs it', async () => {
    const chunk = deferred();
    const importShow = await renderApp('show', async () => {
      await chunk.promise;
      return { RetroShowRoute: StubShow };
    });
    await waitFor(() => expect(importShow).toHaveBeenCalledOnce());
    expect(stage()).toBeNull();
    expect(shell()).toHaveClass('pending');
    expect(screen.queryByTestId(chatTestIds.fab)).toBeNull();
    expect(screen.getByTestId(homeTestIds.name)).toBeInTheDocument();

    chunk.resolve();

    expect(await screen.findByTestId(SHOW_STUB)).toBeInTheDocument();
    expect(shell()).not.toHaveClass('pending');
    expect(stage()).toBe(shell());
    expect(screen.queryByTestId(chatTestIds.fab)).toBeNull();
  });

  it('a show that fails to load falls back to the normal site', async () => {
    await renderApp('show', () =>
      Promise.reject(new Error('Failed to fetch dynamically imported module')),
    );

    expect(await screen.findByTestId(chatTestIds.fab)).toBeInTheDocument();
    expect(stage()).toBeNull();
    expect(shell()).not.toHaveClass('pending');
    expect(screen.queryByTestId(SHOW_STUB)).toBeNull();
  });
});
