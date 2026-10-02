import { renderHook } from '@testing-library/react';
import type { ShowHighlight } from './engine/chunkSelectors';
import { readableClass, useHighlightBoxes } from './useHighlightBoxes';

const target = (queries: string[]): ShowHighlight => ({
  key: 'layer:header-layout',
  phase: 'typing',
  page: false,
  queries,
});

/** A stage with a header at (100, 50) 672 × 188 with margin, border and padding, scrolled 20 px. */
function stage() {
  document.body.innerHTML = `
    <div data-retro-stage>
      <header id="top" class="_hdr_k3j2a_12" style="margin: 8px -4px 16px 0; border: 2px solid; padding: 12px 24px"></header>
      <h2 class="_title_ab12c">A</h2><h2 class="_title_ab12c">B</h2>
    </div>`;
  const rect = (x: number, y: number, width: number, height: number) =>
    DOMRect.fromRect({ x, y, width, height });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    if (this.matches('[data-retro-stage]')) return rect(0, 0, 880, 800);
    if (this.tagName === 'HEADER') return rect(100.4, 50, 671.6, 188.2);
    return rect(0, this.textContent === 'A' ? 300 : 400, 600, 30);
  });
  window.scrollY = 20;
}

describe('useHighlightBoxes (the Elements-style highlight)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.scrollY = 0;
  });

  it('measures the box model of one target and names it on the plate with its size', () => {
    stage();
    const { result } = renderHook(() => useHighlightBoxes(target(['header']), false));
    expect(result.current?.boxes).toEqual([
      {
        left: 100.4,
        top: 70,
        width: 671.6,
        height: 188.2,
        margin: { top: 8, right: 0, bottom: 16, left: 0 },
        border: { top: 2, right: 2, bottom: 2, left: 2 },
        padding: { top: 12, right: 24, bottom: 12, left: 24 },
      },
    ]);
    expect(result.current?.plate).toEqual({
      tag: 'header',
      id: 'top',
      className: 'hdr',
      size: { width: 672, height: 188 },
      count: null,
      anchor: { left: 100.4, bottom: 238.2 },
    });
  });

  it('clamps the plate into the page area and the viewport', () => {
    stage();
    const at = (rect: DOMRect) =>
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect);
    const anchor = () =>
      renderHook(() => useHighlightBoxes(target(['header']), false)).result.current?.plate?.anchor;
    at(DOMRect.fromRect({ x: 100, y: 500, width: 300, height: 600 }));
    expect(anchor()).toEqual({ left: 100, bottom: window.innerHeight });
    at(DOMRect.fromRect({ x: -40, y: 10, width: 300, height: 100 }));
    expect(anchor()).toEqual({ left: 0, bottom: 110 });
  });

  it('counts several matches instead of sizing them', () => {
    stage();
    const { result } = renderHook(() => useHighlightBoxes(target(['h2']), false));
    expect(result.current?.boxes).toHaveLength(2);
    expect(result.current?.plate).toMatchObject({ tag: 'h2', className: 'title', count: 2 });
    expect(result.current?.plate?.size).toBeNull();
  });

  it('shows the page area as `body` for a page-wide chunk', () => {
    stage();
    const page = { ...target([]), page: true };
    const { result } = renderHook(() => useHighlightBoxes(page, false));
    expect(result.current?.boxes).toEqual([]);
    expect(result.current?.plate).toMatchObject({
      tag: 'body',
      size: { width: 880, height: window.innerHeight },
      anchor: null,
    });
  });

  it('reads a CSS Modules class as it is written in the source', () => {
    const element = (className: string) => {
      const div = document.createElement('div');
      div.className = className;
      return div;
    };
    expect(readableClass(element('_title_k3j2a'))).toBe('title');
    expect(readableClass(element('_appCard_1x9zq_40 other'))).toBe('appCard');
    expect(readableClass(element('name'))).toBe('name');
    expect(readableClass(element(''))).toBe('');
  });
});
