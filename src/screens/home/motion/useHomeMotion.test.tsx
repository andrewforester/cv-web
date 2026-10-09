import { act, render, screen } from '@testing-library/react';
import { AppProviders } from '../../../app/AppProviders';
import cvPage from '../../../data/cv/cvPage.json';
import { HomeRoute } from '../HomeRoute';
import { homeTestIds } from '../testIds';
import { installMotionEnv } from './motionTestHarness';

const STAT_VALUES = cvPage.stats.map((stat) => stat.value);

/** Renders the page with fake timers, frames and clock, and lets the repository resolve. */
async function renderPage(wrap = false) {
  const page = (
    <AppProviders>
      <HomeRoute />
    </AppProviders>
  );
  const view = render(wrap ? <div data-retro-stage="">{page}</div> : page);
  await act(async () => {});
  return view;
}

const statValues = () =>
  screen.getAllByTestId(homeTestIds.stat).map((stat) => stat.firstElementChild?.textContent);

const animatedParts = (calls: ReturnType<typeof installMotionEnv>['calls']) =>
  new Set(calls.map(({ el }) => el.getAttribute('data-motion')));

describe('the page motion', () => {
  let env: ReturnType<typeof installMotionEnv> | null = null;
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'performance',
      ],
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    env?.uninstall();
    env = null;
    vi.useRealTimers();
  });

  it('plays the intro: header parts, gradient word, stat tiles and buttons', async () => {
    env = installMotionEnv();
    await renderPage();
    // Everything else waits for its scroll-in (held), except the call to action's drifting background.
    const playing = env.calls.filter(({ animation }) => animation.pause.mock.calls.length === 0);
    expect(animatedParts(playing)).toEqual(
      new Set(['nav', 'avatar', 'names', 'headline', 'accent', 'lead', 'stat', 'button', 'cta']),
    );
    const drift = env.calls.find(({ el }) => el.getAttribute('data-motion') === 'accent');
    expect(drift?.options).toMatchObject({ iterations: Infinity, direction: 'alternate' });
    // Each stat tile: its intro, then its parallax added on top.
    const parallax = env.calls.filter(({ options }) => options.composite === 'add');
    expect(parallax).toHaveLength(STAT_VALUES.length);
  });

  it('counts the stat values up from 0 and ends on the data text', async () => {
    env = installMotionEnv();
    await renderPage();
    expect(statValues()).toEqual(['0+', '0K+', '0', 'AI']);
    act(() => vi.advanceTimersByTime(4000));
    expect(statValues()).toEqual(STAT_VALUES);
  });

  /** Puts the stat tiles beside the summary (wide) or under it (phone); jsdom has no layout. */
  const layOut = (wide: boolean) =>
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function rect(
      this: Element,
    ) {
      const isLead = this.getAttribute('data-motion') === 'lead';
      return { left: isLead || !wide ? 0 : 700, right: isLead ? 650 : 300 } as DOMRect;
    });

  it('fills the progress bar with the scroll and moves the stat tiles', async () => {
    env = installMotionEnv();
    const { container } = await renderPage();
    layOut(true);
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(450);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(20);
    });
    const bar = container.querySelector<HTMLElement>('[data-motion="progress"]');
    expect(bar?.style.transform).toBe('scaleX(1)');
    const parallax = env.calls.filter(({ options }) => options.composite === 'add');
    expect(parallax.map(({ animation }) => animation.currentTime)).toEqual([500, 500, 500, 500]);
  });

  it('keeps the stat tiles still when they sit under the summary (phone)', async () => {
    env = installMotionEnv();
    await renderPage();
    layOut(false);
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(450);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(20);
    });
    const parallax = env.calls.filter(({ options }) => options.composite === 'add');
    expect(parallax.map(({ animation }) => animation.currentTime)).toEqual([0, 0, 0, 0]);
  });

  it.each([
    ['reduced motion', { reduced: true }],
    ['print', { print: true }],
  ])('does not move at all with %s', async (_, options) => {
    env = installMotionEnv(options);
    const { container } = await renderPage();
    expect(env.calls).toEqual([]);
    expect(statValues()).toEqual(STAT_VALUES);
    expect(container.querySelector<HTMLElement>('[data-motion="progress"]')?.style.transform).toBe(
      '',
    );
  });

  it('does not move inside the Show case', async () => {
    env = installMotionEnv();
    await renderPage(true);
    expect(env.calls).toEqual([]);
  });

  it('stops and shows everything at rest when the Show case takes the page', async () => {
    env = installMotionEnv();
    const { container } = await renderPage();
    await act(async () => {
      container.firstElementChild?.setAttribute('data-retro-stage', '');
    });
    expect(env.calls.every(({ animation }) => animation.cancel.mock.calls.length > 0)).toBe(true);
    expect(statValues()).toEqual(STAT_VALUES);
  });

  it('cleans up on unmount', async () => {
    env = installMotionEnv();
    const { unmount } = await renderPage();
    const { calls } = env;
    unmount();
    expect(calls.every(({ animation }) => animation.cancel.mock.calls.length > 0)).toBe(true);
  });

  it('does not move without the Web Animations API (no motion, everything visible)', async () => {
    await renderPage();
    expect(statValues()).toEqual(STAT_VALUES);
  });
});
