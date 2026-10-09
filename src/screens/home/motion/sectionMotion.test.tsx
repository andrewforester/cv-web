import { act, render, screen } from '@testing-library/react';
import { AppProviders } from '../../../app/AppProviders';
import cvPage from '../../../data/cv/cvPage.json';
import { HomeRoute } from '../HomeRoute';
import { homeTestIds } from '../testIds';
import { installMotionEnv, type AnimateCall } from './motionTestHarness';

const IMPACT_VALUES = cvPage.impact.map((card) => card.value);

/** Renders the page and lets the repository resolve. */
async function renderPage() {
  const view = render(
    <AppProviders>
      <HomeRoute />
    </AppProviders>,
  );
  await act(async () => {});
  return view;
}

const part = (call: AnimateCall) => call.el.getAttribute('data-motion');
const callsOf = (calls: AnimateCall[], el: Element) => calls.filter((call) => call.el === el);
const impactValues = () =>
  screen.getAllByTestId(homeTestIds.impactCard).map((card) => card.firstElementChild?.textContent);
const grid = (name: string) => document.querySelector(`[data-motion="${name}"]`) as Element;

describe('the sections motion', () => {
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

  it('holds every section part at its hidden start until its block scrolls in', async () => {
    env = installMotionEnv();
    await renderPage();
    const held = env.calls.filter(({ animation }) => animation.pause.mock.calls.length > 0);
    expect(new Set(held.map(part))).toEqual(
      new Set([
        ...['stat', 'heading', 'skill', 'card', 'panel', 'panel-lead', 'step', 'footnote'],
        ...['job', 'logo', null, 'stem', 'branch', 'project-body', 'column', 'badge', 'cta'],
        'arrow',
      ]),
    );
    const reveals = held.filter((call) => part(call) !== 'stat' && call.options.fill === 'both');
    reveals.forEach(({ keyframes, animation }) => {
      expect(animation.play).not.toHaveBeenCalled();
      const start = keyframes[0]?.opacity ?? keyframes[0]?.clipPath ?? keyframes[0]?.transform;
      expect(String(start)).toMatch(/^0$|inset|scale[XY]\(0\)/);
    });
  });

  it('reveals a block once when it scrolls in, with the design timings', async () => {
    env = installMotionEnv();
    await renderPage();
    const cards = screen.getAllByTestId(homeTestIds.impactCard);
    env.scroll(grid('impact'));
    const played = cards.map((card) => callsOf(env?.calls ?? [], card)[0]);
    expect(played.map((call) => call?.animation.play.mock.calls.length)).toEqual([1, 1, 1]);
    expect(played.map((call) => call?.options.delay)).toEqual([0, 130, 260]);
    expect(played[0]?.options.easing).toBe('cubic-bezier(0.34, 1.56, 0.64, 1)');
    // The other blocks still wait.
    const craftCards = screen.getAllByTestId(homeTestIds.craftCard);
    const craft = craftCards.map((card) => callsOf(env?.calls ?? [], card)[0]);
    expect(craft.map((call) => call?.animation.play.mock.calls.length)).toEqual([0, 0]);
    expect(craft.map((call) => call?.keyframes[0]?.transform)).toEqual([
      'translateX(-80px) rotate(-2deg)',
      'translateX(80px) rotate(2deg)',
    ]);
  });

  it('plays the loop panel: steps in turn, one highlight run each, the typewriter line', async () => {
    env = installMotionEnv();
    await renderPage();
    env.scroll(grid('panel'));
    const steps = screen.getAllByTestId(homeTestIds.loopStep);
    const [first] = steps;
    const runs = callsOf(env.calls, first as Element);
    expect(runs.map(({ options }) => options.delay)).toEqual([350, 1100]);
    expect(runs[1]?.keyframes[1]).toMatchObject({ offset: 0.3, borderColor: '#ff7acb' });
    expect(runs.every(({ animation }) => animation.play.mock.calls.length === 1)).toBe(true);
    const typewriter = callsOf(env.calls, grid('footnote'))[0];
    expect(typewriter?.options).toMatchObject({
      duration: 1800,
      easing: 'steps(56, end)',
      delay: 400 + steps.length * 110,
    });
  });

  it('counts the impact figures up once their cards scroll in', async () => {
    env = installMotionEnv();
    await renderPage();
    // The real figures until the cards scroll in (screen readers, find-in-page, copy).
    expect(impactValues()).toEqual(IMPACT_VALUES);
    env.scroll(grid('impact'));
    expect(impactValues()).toEqual(['0K+', '0 days', '0 day']);
    act(() => vi.advanceTimersByTime(3000));
    expect(impactValues()).toEqual(IMPACT_VALUES);
  });

  it('shows at once whatever the page agent highlights, before it scrolled in', async () => {
    env = installMotionEnv();
    await renderPage();
    const [card] = screen.getAllByTestId(homeTestIds.impactCard);
    await act(async () => {
      card?.setAttribute('data-agent-highlighted', '');
    });
    const reveals = callsOf(env.calls, card as Element);
    expect(reveals[0]?.animation.finish).toHaveBeenCalled();
    expect(impactValues()).toEqual(IMPACT_VALUES);
    const section = screen.getByTestId(homeTestIds.impact);
    const heading = section.querySelector('[data-motion="heading"]') as Element;
    expect(callsOf(env.calls, heading)[0]?.animation.finish).toHaveBeenCalled();
  });

  it('tilts the cards only with a mouse', async () => {
    env = installMotionEnv({ hover: false });
    await renderPage();
    const [card] = screen.getAllByTestId(homeTestIds.craftCard);
    callsOf(env.calls, card as Element)[0]?.animation.finish();
    const before = env.calls.length;
    card?.dispatchEvent(new MouseEvent('mousemove', { clientX: 10, clientY: 10 }));
    expect(env.calls).toHaveLength(before);
  });
});
