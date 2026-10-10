import { fireEvent, render, screen, within } from '@testing-library/react';
import { FakeShowRepository, SHOW_SCENARIOS, type ShowScenarioId } from '../data/retro';
import { homeTestIds } from '../screens/home/testIds';
import { showCaseTestId } from '../shared/ShowCaseButton';
import { showCaseLinkTestId } from '../shared/ShowCaseLink';

// The Show case button at the end of the page's meta bar (docs/retro/ARCHITECTURE.md §11): the
// shell offers it while the page has a scenario, on a desktop viewport. The wiring is checked with
// a stubbed scenario and show chunk, so a page without a show is covered too.
const SHOW_MODULE = '../screens/retro/RetroShowRoute';
const SCENARIOS_MODULE = './showScenarios';
const SHOW_STUB = 'show-stub';
const A_SCENARIO = Object.keys(SHOW_SCENARIOS)[0] as ShowScenarioId;

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
  scenario = A_SCENARIO,
  desktop = true,
}: { scenario?: ShowScenarioId | null; desktop?: boolean } = {}) {
  stubViewport(desktop);
  vi.resetModules();
  vi.doMock(SHOW_MODULE, async () => ({ RetroShowRoute: StubShow }));
  vi.doMock(SCENARIOS_MODULE, () => ({ SHOW_SCENARIO: scenario ?? undefined }));
  const { App } = await import('./App');
  const { AppProviders } = await import('./AppProviders');
  render(
    <AppProviders retroMode="normal" showRepository={new FakeShowRepository()}>
      <App />
    </AppProviders>,
  );
  await screen.findByTestId(homeTestIds.name);
  return within(screen.getByTestId(homeTestIds.metaBar));
}

describe('App: the Show case button', () => {
  // The chat is a lazy chunk: imported once up front, a cold import can't outlast `findBy`'s 1 s.
  beforeAll(() => import('../screens/chat/ChatRoute'));
  beforeEach(() => {
    // jsdom doesn't scroll; the shell scrolls to the top when the show starts.
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.doUnmock(SHOW_MODULE);
    vi.doUnmock(SCENARIOS_MODULE);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('is hidden while the page has no show', async () => {
    const metaBar = await renderApp({ scenario: null });
    expect(metaBar.queryByTestId(showCaseTestId)).not.toBeInTheDocument();
  });

  it('is hidden on a desktop viewport even when the page has a show (CV-144)', async () => {
    const metaBar = await renderApp();
    expect(metaBar.queryByTestId(showCaseTestId)).not.toBeInTheDocument();
    expect(screen.queryByTestId(SHOW_STUB)).toBeNull();
  });

  it('is hidden below 1024 px', async () => {
    const metaBar = await renderApp({ desktop: false });
    expect(metaBar.queryByTestId(showCaseTestId)).not.toBeInTheDocument();
  });
});

describe('App: the footer Show case link (CV-148)', () => {
  beforeAll(() => import('../screens/chat/ChatRoute'));
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.doUnmock(SHOW_MODULE);
    vi.doUnmock(SCENARIOS_MODULE);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('sits next to the copyright and starts the show', async () => {
    await renderApp();
    const link = screen.getByTestId(showCaseLinkTestId);
    expect(screen.getByTestId(homeTestIds.copyright).parentElement).toContainElement(link);
    expect(screen.queryByTestId(SHOW_STUB)).toBeNull();
    fireEvent.click(link);
    expect(await screen.findByTestId(SHOW_STUB)).toBeInTheDocument();
  });

  it('is hidden while the page has no show', async () => {
    await renderApp({ scenario: null });
    expect(screen.queryByTestId(showCaseLinkTestId)).not.toBeInTheDocument();
  });

  it('is hidden below 1024 px', async () => {
    await renderApp({ desktop: false });
    expect(screen.queryByTestId(showCaseLinkTestId)).not.toBeInTheDocument();
  });
});
