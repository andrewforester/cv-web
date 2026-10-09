import { renderHook } from '@testing-library/react';
import type { ChatDock } from '../screens/chat/chatDock';
import { usePageAnchor } from './usePageAnchor';

// jsdom has no layout: the page is faked as `main` with one anchor whose top moves as the "page"
// reflows, and `scrollBy` moves it back like a real scroll would.
let anchorTop = 0;
let scrollY = 0;
let transitionDuration = '0.3s';
let main: HTMLElement;
let anchor: HTMLElement;
let frames: FrameRequestCallback[] = [];
let scrollBy: ReturnType<typeof vi.fn>;

const rect = (top: number) => ({ top, left: 0, width: 1000 }) as DOMRect;
const scrolledBy = (top: number) => ({ top, behavior: 'instant' });

function runFrame(now: number) {
  const queued = frames;
  frames = [];
  queued.forEach((cb) => cb(now));
}

function renderAnchor(dock: ChatDock) {
  const ref = { current: main };
  return renderHook(({ d }) => usePageAnchor(ref, d), { initialProps: { d: dock } });
}

beforeEach(() => {
  anchorTop = 100;
  transitionDuration = '0.3s';
  frames = [];
  main = document.createElement('main');
  anchor = document.createElement('p');
  main.append(anchor);
  document.body.append(main);
  main.getBoundingClientRect = () => rect(-2000);
  anchor.getBoundingClientRect = () => rect(anchorTop);
  document.elementFromPoint = vi.fn(() => anchor);
  vi.spyOn(window, 'getComputedStyle').mockImplementation(
    () => ({ paddingInlineEnd: '0px', transitionDuration }) as CSSStyleDeclaration,
  );
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
  vi.stubGlobal('cancelAnimationFrame', () => {
    frames = [];
  });
  scrollY = 0;
  vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => scrollY);
  scrollBy = vi.fn(({ top = 0 }: ScrollToOptions) => {
    anchorTop -= top;
    scrollY += top;
  });
  window.scrollBy = scrollBy as unknown as typeof window.scrollBy;
});

afterEach(() => {
  main.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('usePageAnchor', () => {
  it('scrolls by the anchor drift on every frame until the transition ends', () => {
    const { rerender } = renderAnchor('none');
    rerender({ d: 'side' });

    anchorTop = 160;
    runFrame(0);
    expect(scrollBy).toHaveBeenLastCalledWith(scrolledBy(60));
    expect(anchorTop).toBe(100);

    anchorTop = 130;
    runFrame(16);
    expect(scrollBy).toHaveBeenLastCalledWith(scrolledBy(30));

    anchorTop = 110;
    main.dispatchEvent(new Event('transitionend'));
    expect(scrollBy).toHaveBeenLastCalledWith(scrolledBy(10));
    expect(frames).toHaveLength(0);
  });

  it('notes the anchor below the top of the visible part of main', () => {
    const { rerender } = renderAnchor('side');
    rerender({ d: 'none' });
    expect(document.elementFromPoint).toHaveBeenCalledWith(500, 8);
  });

  it('stops by itself after the duration plus a little slack', () => {
    const { rerender } = renderAnchor('none');
    rerender({ d: 'side' });
    runFrame(0);
    runFrame(340);
    expect(frames).toHaveLength(1);
    runFrame(351);
    expect(frames).toHaveLength(0);
  });

  it('corrects once when nothing animates (reduced motion)', async () => {
    transitionDuration = '0s';
    const { rerender } = renderAnchor('none');
    rerender({ d: 'side' });
    anchorTop = 600;
    await Promise.resolve();
    expect(scrollBy).toHaveBeenCalledWith(scrolledBy(500));
    runFrame(0);
    expect(frames).toHaveLength(0);
  });

  it.each(['wheel', 'touchstart', 'keydown'])('hands the scroll back on %s', (type) => {
    const { rerender } = renderAnchor('none');
    rerender({ d: 'side' });
    window.dispatchEvent(new Event(type));
    anchorTop = 300;
    runFrame(0);
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('gives way to a scroll it did not make (the page agent)', () => {
    const { rerender } = renderAnchor('none');
    rerender({ d: 'side' });
    anchorTop = 160;
    runFrame(0);
    expect(scrollY).toBe(60);
    window.dispatchEvent(new Event('scroll'));
    expect(frames).toHaveLength(1);

    scrollY = 900;
    window.dispatchEvent(new Event('scroll'));
    expect(frames).toHaveLength(0);
  });

  it('leaves the page alone when the width does not change', () => {
    const { rerender } = renderAnchor('none');
    rerender({ d: 'bottom' });
    rerender({ d: 'none' });
    expect(document.elementFromPoint).not.toHaveBeenCalled();
  });

  it('ignores a point outside main (the chat column)', () => {
    vi.mocked(document.elementFromPoint).mockReturnValue(document.body);
    const { rerender } = renderAnchor('none');
    rerender({ d: 'side' });
    expect(frames).toHaveLength(0);
  });
});
