import { createMotion, up } from './motionKit';
import { installMotionEnv } from './motionTestHarness';
import { readMotionTokens } from './motionTokens';

describe('createMotion', () => {
  let env: ReturnType<typeof installMotionEnv>;
  beforeEach(() => {
    env = installMotionEnv();
  });
  afterEach(() => env.uninstall());

  const start = () => {
    const tokens = readMotionTokens();
    if (!tokens) throw new Error('motion tokens missing');
    return createMotion(tokens);
  };

  it('reads the tokens as numbers and strings', () => {
    expect(readMotionTokens()).toMatchObject({ duration: 900, countDuration: 1400 });
  });

  it('plays with the tokens by default and removes a finished one-off', () => {
    const motion = start();
    const el = document.createElement('div');
    motion.once(el, up(24), { delay: 550 });
    const [call] = env.calls;
    expect(call?.options).toEqual({
      duration: 900,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'both',
      delay: 550,
    });
    call?.animation.onfinish?.call(call.animation, new Event('finish') as AnimationPlaybackEvent);
    expect(call?.animation.cancel).toHaveBeenCalled();
  });

  it('reveals once: fires on the first intersection, then stops watching', () => {
    const motion = start();
    const target = document.createElement('section');
    const fn = vi.fn();
    motion.onReveal(target, fn);
    const observerMock = vi.mocked(IntersectionObserver);
    const [callback, options] = observerMock.mock.calls[0] ?? [];
    const observer = observerMock.mock.results[0]?.value as IntersectionObserver;
    expect(options).toEqual({ threshold: 0, rootMargin: '0px 0px -10% 0px' });
    expect(observer.observe).toHaveBeenCalledWith(target);

    const entry = { isIntersecting: true, target } as unknown as IntersectionObserverEntry;
    callback?.([entry], observer);
    callback?.([entry], observer);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(observer.unobserve).toHaveBeenCalledWith(target);
  });

  it('stops everything once and starts nothing after', () => {
    const motion = start();
    const onStop = vi.fn();
    const later = vi.fn();
    vi.useFakeTimers();
    motion.run(document.createElement('div'), up(10));
    motion.onStop(onStop);
    motion.later(later, 100);
    motion.stop();
    motion.stop();
    vi.advanceTimersByTime(200);
    vi.useRealTimers();
    expect(env.calls[0]?.animation.cancel).toHaveBeenCalledTimes(1);
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(later).not.toHaveBeenCalled();
    expect(motion.run(document.createElement('div'), up(10))).toBeNull();
  });
});
