import { useLayoutEffect, useState } from 'react';
import type { ShowHighlight } from './engine/chunkSelectors';
import type { HighlightBox, HighlightUi } from './RetroShowUiState';

/** At most this many rectangles for a many-match target (SPEC → Highlight). */
const MAX_BOXES = 12;
const NO_BOXES: HighlightBox[] = [];

/** Right edge of the page area: the viewport minus the dock's reserve while it is shown. */
function pageAreaRight(): number {
  const reserve = parseFloat(getComputedStyle(document.body).paddingRight) || 0;
  return document.documentElement.clientWidth - reserve;
}

/**
 * The matches to frame: those at least partly in the page area (up to 12); when none is in view,
 * the first one on the page (the one the camera goes to). Hidden matches have no box.
 */
function measure(query: string): HighlightBox[] {
  const rects = Array.from(document.querySelectorAll(query), (element) =>
    element.getBoundingClientRect(),
  ).filter((rect) => rect.width > 0 || rect.height > 0);
  const right = pageAreaRight();
  const inArea = rects.filter(
    (rect) =>
      rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < right,
  );
  return (inArea.length ? inArea : rects.slice(0, 1)).slice(0, MAX_BOXES).map((rect) => ({
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
  }));
}

const same = (a: HighlightBox[], b: HighlightBox[]) => JSON.stringify(a) === JSON.stringify(b);

/**
 * The highlight as the screen draws it: the runner's `highlightOf` plus the targets' boxes,
 * re-measured every animation frame while a chunk is highlighted (a fade resizes its targets, a
 * morph moves them, the camera or the visitor scrolls) and not at all otherwise.
 */
export function useHighlightBoxes(highlight: ShowHighlight | null): HighlightUi | null {
  const [boxes, setBoxes] = useState(NO_BOXES);
  const query = highlight && !highlight.page ? highlight.queries.join(', ') : '';

  useLayoutEffect(() => {
    if (!query) return;
    let frame = 0;
    const update = () => {
      setBoxes((current) => {
        const next = measure(query);
        return same(current, next) ? current : next;
      });
      frame = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(frame);
  }, [query]);

  if (!highlight) return null;
  const { key, phase, page } = highlight;
  return { key, phase, page, boxes: page ? NO_BOXES : boxes };
}
