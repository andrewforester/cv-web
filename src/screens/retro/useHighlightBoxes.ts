import { useLayoutEffect } from 'react';
import { STAGE_SELECTOR, type ShowHighlight } from './engine/chunkSelectors';
import type { HighlightBox, HighlightUi } from './RetroShowUiState';
import { useFollowFrames } from './useFollowFrames';
import { useMeasuredState } from './useMeasuredState';

/** At most this many rectangles for a many-match target (SPEC → Highlight). */
const MAX_BOXES = 12;
const NO_BOXES: HighlightBox[] = [];

/** Right edge of the page area (the viewport minus the dock's reserve): the stage's own edge. */
function pageAreaRight(): number {
  return document.querySelector(STAGE_SELECTOR)?.getBoundingClientRect().right ?? window.innerWidth;
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

/**
 * The highlight as the screen draws it: the runner's `highlightOf` plus the targets' boxes,
 * measured when the target changes, on scroll and resize (which matches are in the page area),
 * and every animation frame while a change is `moving` its targets (a fade or a morph).
 */
export function useHighlightBoxes(
  highlight: ShowHighlight | null,
  moving: boolean,
): HighlightUi | null {
  const [boxes, setBoxes] = useMeasuredState(NO_BOXES);
  const query = highlight && !highlight.page ? highlight.queries.join(', ') : '';

  useLayoutEffect(() => {
    if (!query) return;
    const update = () => setBoxes(measure(query));
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [query, setBoxes]);

  useFollowFrames(!!query && moving, () => setBoxes(measure(query)));

  if (!highlight) return null;
  const { key, phase, page } = highlight;
  return { key, phase, page, boxes: page ? NO_BOXES : boxes };
}
