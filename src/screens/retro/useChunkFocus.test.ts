import { renderHook } from '@testing-library/react';
import type { CurrentChunk } from './engine/chunkSelectors';
import { useChunkFocus } from './useChunkFocus';

const chunk = (status: CurrentChunk['status'] = 'typing'): CurrentChunk => ({
  key: 'layer:heading-colors',
  target: { label: 'titles', selectors: ['h2'] },
  motion: 'fade',
  status,
  appliedAt: null,
});

/** A stage with one title at `top` (viewport px) in a 5000 px tall page, 24 px scroll margin. */
function stage(top: number) {
  document.body.innerHTML = '<div data-retro-stage><h2>Summary</h2></div>';
  const title = document.querySelector('h2');
  vi.spyOn(title as Element, 'getBoundingClientRect').mockReturnValue(
    DOMRect.fromRect({ x: 0, y: top, width: 600, height: 40 }),
  );
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: 5_000,
  });
  document.documentElement.style.setProperty('--agent-scroll-margin-top', '24px');
  return vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
}

/** Mounts the camera between chunks, lets `before` happen (e.g. a visitor scroll), then starts one. */
function focus(
  options: { reducedMotion?: boolean; current?: CurrentChunk; before?: () => void } = {},
) {
  const dispatch = vi.fn();
  const { rerender } = renderHook(
    (current: CurrentChunk | null) =>
      useChunkFocus(current, options.reducedMotion ?? false, dispatch),
    { initialProps: null as CurrentChunk | null },
  );
  options.before?.();
  rerender(options.current ?? chunk());
  return dispatch;
}

const settled = { type: 'focusSettled', key: 'layer:heading-colors' };

describe('useChunkFocus (the show camera)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('scrolls smoothly to an out-of-view target, then reports the camera settled', () => {
    const scrollTo = stage(2_000);
    const dispatch = focus();
    expect(scrollTo).toHaveBeenCalledWith({ top: 1_976, behavior: 'smooth' });
    expect(dispatch).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('scrollend'));
    expect(dispatch).toHaveBeenCalledWith(settled);
  });

  it('stays put when the target is already in view', () => {
    const scrollTo = stage(300);
    const dispatch = focus();
    expect(scrollTo).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(settled);
  });

  it('leaves the page alone for 4 s after the visitor scrolled', () => {
    const scrollTo = stage(2_000);
    const dispatch = focus({ before: () => window.dispatchEvent(new Event('scroll')) });
    expect(scrollTo).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(settled);
  });

  it('jumps instead of scrolling with reduced motion', () => {
    const scrollTo = stage(2_000);
    focus({ reducedMotion: true });
    expect(scrollTo).toHaveBeenCalledWith({ top: 1_976, behavior: 'instant' });
  });

  it('does nothing once the chunk has applied', () => {
    const scrollTo = stage(2_000);
    const dispatch = focus({ current: chunk('applied') });
    expect(scrollTo).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });
});
