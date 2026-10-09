import { spotlight, tilt } from './hoverMotion';
import { createMotion, up } from './motionKit';
import { installMotionEnv } from './motionTestHarness';
import { readMotionTokens } from './motionTokens';

describe('hover motion', () => {
  let env: ReturnType<typeof installMotionEnv>;
  beforeEach(() => {
    env = installMotionEnv();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    env.uninstall();
  });

  const start = () => {
    const tokens = readMotionTokens();
    if (!tokens) throw new Error('motion tokens missing');
    return createMotion(tokens);
  };

  /** A 200×100 box at the viewport's origin. */
  const box = (el: Element) =>
    vi
      .spyOn(el, 'getBoundingClientRect')
      .mockReturnValue({ left: 0, top: 0, width: 200, height: 100 } as DOMRect);

  const move = (el: Element, clientX: number, clientY: number) =>
    el.dispatchEvent(new MouseEvent('mousemove', { clientX, clientY }));

  const transforms = (el: Element) =>
    env.calls
      .filter((call) => call.el === el && call.keyframes.length === 1)
      .map(({ keyframes }) => keyframes[0]?.transform);

  it('tilts a card towards the cursor only once its reveal has finished', () => {
    const motion = start();
    const card = document.createElement('div');
    box(card);
    motion.reveal(card, card, up(30));
    tilt(motion, card);

    move(card, 200, 0);
    expect(transforms(card)).toEqual([]);

    env.calls[0]?.animation.finish();
    move(card, 200, 0);
    expect(transforms(card)).toEqual([
      'perspective(800px) rotateX(4.00deg) rotateY(5.00deg) translateY(-4px)',
    ]);
  });

  it('eases a card back flat on leave, then hands it back to its own styles', () => {
    const motion = start();
    const card = document.createElement('div');
    box(card);
    motion.reveal(card, card, up(30));
    env.calls[0]?.animation.finish();
    tilt(motion, card);
    move(card, 100, 50);
    card.dispatchEvent(new MouseEvent('mouseleave'));
    const [tiltIn, back] = env.calls.slice(1);
    expect(back?.keyframes[0]?.transform).toContain('rotateX(0.00deg) rotateY(0.00deg)');
    expect(back?.options.duration).toBe(600);
    back?.animation.finish();
    expect(tiltIn?.animation.cancel).toHaveBeenCalled();
    expect(back?.animation.cancel).toHaveBeenCalled();
  });

  it('stops tilting when the motion stops', () => {
    const motion = start();
    const card = document.createElement('div');
    box(card);
    motion.reveal(card, card, up(30));
    env.calls[0]?.animation.finish();
    tilt(motion, card);
    move(card, 10, 10);
    const tiltIn = env.calls[1];
    motion.stop();
    move(card, 20, 20);
    expect(tiltIn?.animation.cancel).toHaveBeenCalled();
    expect(env.calls).toHaveLength(2);
  });

  it('moves the spotlight to the cursor and fades it out on leave', () => {
    const motion = start();
    const panel = document.createElement('div');
    const spot = document.createElement('span');
    panel.append(spot);
    box(panel);
    vi.spyOn(spot, 'offsetWidth', 'get').mockReturnValue(420);
    vi.spyOn(spot, 'offsetHeight', 'get').mockReturnValue(420);
    spotlight(motion, panel, spot);

    move(panel, 300, 250);
    panel.dispatchEvent(new MouseEvent('mouseleave'));
    expect(env.calls.map(({ keyframes }) => keyframes[0])).toEqual([
      { opacity: 1, transform: 'translate(90px, 40px)' },
      { opacity: 0 },
    ]);
    expect(env.calls.map(({ options }) => options.duration)).toEqual([500, 600]);
  });
});
