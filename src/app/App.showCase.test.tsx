import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ShowScenarioId } from '../data/retro';
import { FakeShowRepository } from '../data/retro';
import type { Locale } from '../i18n';
import { forestTestIds } from '../shared/forest/testIds';

// The Show case button in the meta bar (docs/retro/ARCHITECTURE.md §10): the shell offers it on a
// page with a scenario, in English, on a desktop viewport. The show's chunk is a stub here.
const SHOW_MODULE = '../screens/retro/RetroShowRoute';
const SHOW_STUB = 'show-stub';

function StubShow({ scenario }: { scenario: ShowScenarioId }) {
  return <div data-testid={SHOW_STUB} data-scenario={scenario} />;
}

function stubViewport(desktop: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: desktop && query.includes('min-width: 1024px'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

async function renderApp({
  path = '/',
  locale = 'en',
  desktop = true,
}: { path?: string; locale?: Locale; desktop?: boolean } = {}) {
  window.history.replaceState(null, '', path);
  stubViewport(desktop);
  vi.resetModules();
  vi.doMock(SHOW_MODULE, async () => ({ RetroShowRoute: StubShow }));
  const { App } = await import('./App');
  const { AppProviders } = await import('./AppProviders');
  render(
    <AppProviders locale={locale} retroMode="normal" showRepository={new FakeShowRepository()}>
      <App />
    </AppProviders>,
  );
  return within(await screen.findByTestId(forestTestIds.metaBar));
}

describe('App: the Show case button', () => {
  // The chat is a lazy chunk: imported once up front, a cold import can't outlast `findBy`'s 1 s.
  beforeAll(() => import('../screens/chat/ChatRoute'));
  beforeEach(() => {
    // jsdom doesn't scroll; the shell scrolls to the top when the show starts.
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });
  afterEach(() => {
    window.history.replaceState(null, '', '/');
    vi.doUnmock(SHOW_MODULE);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('is in the meta bar on / for English on a desktop viewport, before the switcher', async () => {
    const metaBar = await renderApp();
    const button = metaBar.getByRole('button', { name: /Show case/ });
    expect(button).toHaveAttribute('data-testid', forestTestIds.showCase);
    expect(button.nextElementSibling).toBe(metaBar.getByTestId('language-switcher'));
  });

  it("starts /'s scenario when clicked", async () => {
    const metaBar = await renderApp();
    expect(screen.queryByTestId(SHOW_STUB)).toBeNull();

    await userEvent.click(metaBar.getByTestId(forestTestIds.showCase));

    expect(await screen.findByTestId(SHOW_STUB)).toHaveAttribute('data-scenario', 'retro-3');
  });

  it('is hidden for Ukrainian', async () => {
    const metaBar = await renderApp({ locale: 'uk' });
    expect(metaBar.queryByTestId(forestTestIds.showCase)).not.toBeInTheDocument();
    expect(metaBar.getByTestId('language-switcher')).toBeInTheDocument();
  });

  it('is hidden below 1024 px', async () => {
    const metaBar = await renderApp({ desktop: false });
    expect(metaBar.queryByTestId(forestTestIds.showCase)).not.toBeInTheDocument();
  });

  it("is in /new's meta bar before the switcher and starts /new's scenario", async () => {
    const metaBar = await renderApp({ path: '/new' });
    const button = metaBar.getByTestId(forestTestIds.showCase);
    expect(button.nextElementSibling).toBe(metaBar.getByTestId('language-switcher'));

    await userEvent.click(button);

    expect(await screen.findByTestId(SHOW_STUB)).toHaveAttribute('data-scenario', 'retro-new-1');
  });
});
