import { act, renderHook, waitFor } from '@testing-library/react';
import type { ShowScenarioId } from '../data/retro';

// The show's chunk, replaced per test (vi.doMock + a fresh module registry) so each test controls
// whether and when the hook's `import()` of it resolves.
const SHOW_MODULE = '../screens/retro/RetroShowRoute';

function StubShow() {
  return null;
}

/** A promise the test settles by hand. */
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((settle) => (resolve = settle));
  return { promise, resolve };
}

async function renderShowCase(
  atLoad: boolean,
  chunk: Promise<void> = Promise.resolve(),
  page: { scenario?: ShowScenarioId } = { scenario: 'retro-3' },
) {
  vi.resetModules();
  const importShow = vi.fn(async () => {
    await chunk;
    return { RetroShowRoute: StubShow };
  });
  vi.doMock(SHOW_MODULE, importShow);
  const { useShowCase } = await import('./useShowCase');
  return { importShow, ...renderHook(() => useShowCase(page.scenario, atLoad)) };
}

describe('useShowCase: the seam that starts the show', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.doUnmock(SHOW_MODULE);
    vi.restoreAllMocks();
  });

  it('does nothing on its own: no auto-start, the chunk is not requested', async () => {
    const { result, importShow } = await renderShowCase(false);
    expect(result.current).toMatchObject({ showing: false, pending: false, Show: null });
    expect(importShow).not.toHaveBeenCalled();
  });

  it('start() keeps today’s site until the chunk has loaded, then swaps at the top', async () => {
    const chunk = deferred();
    const { result, importShow } = await renderShowCase(false, chunk.promise);

    act(() => result.current.start());
    await waitFor(() => expect(importShow).toHaveBeenCalledOnce());
    expect(result.current).toMatchObject({ showing: false, pending: false });
    expect(window.scrollTo).not.toHaveBeenCalled();

    chunk.resolve();
    await waitFor(() => expect(result.current.showing).toBe(true));
    expect(result.current.Show).toBe(StubShow);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
  });

  it('end() returns to today’s site, and start() again replays at once', async () => {
    const { result, importShow } = await renderShowCase(false);
    act(() => result.current.start());
    await waitFor(() => expect(result.current.showing).toBe(true));

    act(() => result.current.end());
    expect(result.current.showing).toBe(false);

    act(() => result.current.start());
    expect(result.current.showing).toBe(true);
    expect(importShow).toHaveBeenCalledOnce();
  });

  it('?retro=1 at load: pending (the shell hidden) until the chunk has loaded', async () => {
    const chunk = deferred();
    const { result } = await renderShowCase(true, chunk.promise);
    expect(result.current).toMatchObject({ showing: false, pending: true });
    chunk.resolve();
    await waitFor(() => expect(result.current.showing).toBe(true));
    expect(result.current.pending).toBe(false);
  });

  it('a page without a scenario has no show: neither ?retro=1 nor start() requests it', async () => {
    const { result, importShow } = await renderShowCase(true, Promise.resolve(), {});
    expect(result.current).toMatchObject({ showing: false, pending: false, Show: null });

    act(() => result.current.start());
    await act(() => Promise.resolve());
    expect(result.current).toMatchObject({ showing: false, pending: false, Show: null });
    expect(importShow).not.toHaveBeenCalled();
  });
});
