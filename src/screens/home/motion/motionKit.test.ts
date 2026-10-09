import { createMotion, up } from './motionKit';
import { installMotionEnv } from './motionTestHarness';
import { parseDuration, readMotionTokens } from './motionTokens';

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

  it('reads durations in ms or s (the build writes 900ms as .9s)', () => {
    expect(parseDuration('900ms')).toBe(900);
    expect(parseDuration('.9s')).toBe(900);
    expect(parseDuration('1.4s')).toBe(1400);
    expect(parseDuration('fast')).toBeNaN();
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

  it('holds a reveal at its hidden start until its trigger scrolls in, then plays it once', () => {
    const motion = start();
    const trigger = document.createElement('section');
    const el = document.createElement('div');
    trigger.append(el);
    motion.reveal(trigger, el, up(30));
    const [call] = env.calls;
    expect(call?.options.fill).toBe('both');
    expect(call?.animation.pause).toHaveBeenCalled();
    expect(call?.animation.currentTime).toBe(0);
    expect(call?.animation.play).not.toHaveBeenCalled();

    env.scroll(trigger, 'below');
    expect(call?.animation.play).not.toHaveBeenCalled();
    env.scroll(trigger);
    env.scroll(trigger);
    expect(call?.animation.play).toHaveBeenCalledTimes(1);
    expect(env.watching(trigger)).toBe(false);
  });

  it('settles a reveal when it finishes: its effect is removed and hover may start', () => {
    const motion = start();
    const el = document.createElement('div');
    motion.reveal(el, el, up(30));
    expect(motion.isSettled(el)).toBe(false);
    env.calls[0]?.animation.finish();
    expect(motion.isSettled(el)).toBe(true);
    expect(env.calls[0]?.animation.cancel).toHaveBeenCalled();
  });

  it('shows at once what was already scrolled past when first checked', () => {
    const motion = start();
    const el = document.createElement('div');
    motion.reveal(el, el, up(30));
    env.scroll(el, 'above');
    expect(env.calls[0]?.animation.finish).toHaveBeenCalled();
    expect(env.calls[0]?.animation.play).not.toHaveBeenCalled();
  });

  it('plays a decoration on the reveal, and skips it when shown at once', () => {
    const motion = start();
    const [a, b] = [document.createElement('div'), document.createElement('div')];
    motion.playOnReveal(a, a, up(10));
    motion.playOnReveal(b, b, up(10));
    env.scroll(a);
    env.scroll(b, 'above');
    expect(env.calls.map(({ animation }) => animation.play.mock.calls.length)).toEqual([1, 0]);
  });

  it('shows now, finished, every waiting reveal in or around an element, and nothing else', () => {
    const motion = start();
    document.body.innerHTML =
      '<section id="s"><div id="grid"><div id="card"></div></div></section><div id="other"></div>';
    const byId = (id: string) => document.getElementById(id) as Element;
    motion.reveal(byId('s'), byId('s'), up(30));
    motion.reveal(byId('grid'), byId('card'), up(30));
    motion.reveal(byId('other'), byId('other'), up(30));
    motion.showNow(byId('grid'));
    expect(env.calls.map(({ animation }) => animation.finish.mock.calls.length)).toEqual([1, 1, 0]);
    expect(env.watching(byId('s'))).toBe(false);
    expect(env.watching(byId('other'))).toBe(true);
    document.body.innerHTML = '';
  });
});
