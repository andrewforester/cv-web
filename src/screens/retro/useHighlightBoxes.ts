import { useLayoutEffect } from 'react';
import { STAGE_SELECTOR, type ShowHighlight } from './engine/chunkSelectors';
import type { BoxEdges, HighlightBox, HighlightPlate, HighlightUi } from './RetroShowUiState';
import { useFollowFrames } from './useFollowFrames';
import { useMeasuredState } from './useMeasuredState';

/** At most this many overlays for a many-match target (SPEC → Highlight). */
const MAX_BOXES = 12;
/** A CSS Modules class (`_title_k3j2a`, `_title_k3j2a_12`): the plate shows `title`. */
const MODULE_CLASS = /^_(.+)_[a-z0-9]{5}(?:_\d+)?$/i;
const READABLE_CLASS = /^[a-z][\w-]*$/i;

interface Measured {
  boxes: HighlightBox[];
  plate: HighlightPlate | null;
}

/** The plate's bottom-left corner on the first target's, kept in the page area (SPEC → Plate). */
function plateAnchor(rect: DOMRect, right: number): { left: number; bottom: number } {
  const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), max);
  return { left: clamp(rect.left, right), bottom: clamp(rect.bottom, window.innerHeight) };
}

const NOTHING: Measured = { boxes: [], plate: null };

/** Right edge of the page area (the viewport minus the dock's reserve): the stage's own edge. */
function pageAreaRight(): number {
  return document.querySelector(STAGE_SELECTOR)?.getBoundingClientRect().right ?? window.innerWidth;
}

function edges(style: CSSStyleDeclaration, name: (side: keyof BoxEdges) => string): BoxEdges {
  const px = (side: keyof BoxEdges) =>
    Math.max(0, parseFloat(style.getPropertyValue(name(side))) || 0);
  return { top: px('top'), right: px('right'), bottom: px('bottom'), left: px('left') };
}

/** The element's border box in page pixels with its margin, border and padding widths. */
function boxOf(element: Element, rect: DOMRect): HighlightBox {
  const style = getComputedStyle(element);
  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
    margin: edges(style, (side) => `margin-${side}`),
    border: edges(style, (side) => `border-${side}-width`),
    padding: edges(style, (side) => `padding-${side}`),
  };
}

/** The class as it reads in the source: the first class, its CSS Modules hash stripped. */
export function readableClass(element: Element): string {
  const first = element.classList[0] ?? '';
  const local = MODULE_CLASS.exec(first)?.[1] ?? first;
  return READABLE_CLASS.test(local) ? local : '';
}

/**
 * Every visible match is framed while at least partly in the page area (up to 12); when none is
 * in view, the first one on the page (the one the camera goes to). The plate names the first match
 * in page order with its live size, or counts the matches when there are several, and sits on that
 * match's bottom-left corner.
 */
function measure(query: string): Measured {
  const matches = Array.from(document.querySelectorAll(query), (element) => ({
    element,
    rect: element.getBoundingClientRect(),
  })).filter(({ rect }) => rect.width > 0 || rect.height > 0);
  const [first] = matches;
  if (!first) return NOTHING;
  const right = pageAreaRight();
  const inArea = matches.filter(
    ({ rect }) =>
      rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < right,
  );
  const several = matches.length > 1;
  return {
    boxes: (inArea.length ? inArea : [first])
      .slice(0, MAX_BOXES)
      .map(({ element, rect }) => boxOf(element, rect)),
    plate: {
      tag: first.element.tagName.toLowerCase(),
      id: first.element.id,
      className: readableClass(first.element),
      size: several
        ? null
        : { width: Math.round(first.rect.width), height: Math.round(first.rect.height) },
      count: several ? matches.length : null,
      anchor: plateAnchor(first.rect, right),
    },
  };
}

/** A page-wide chunk: no boxes; the plate is `body` with the page area's size. */
function measurePage(): Measured {
  const size = { width: Math.round(pageAreaRight()), height: window.innerHeight };
  return {
    boxes: [],
    plate: { tag: 'body', id: '', className: '', size, count: null, anchor: null },
  };
}

const measureTarget = (page: boolean, query: string) => (page ? measurePage() : measure(query));

/**
 * The highlight as the screen draws it: the runner's `highlightOf` plus the targets' box models
 * and the plate, measured when the target changes, on scroll and resize (which matches are in the
 * page area), and every animation frame while a change is `moving` its targets (a fade or a morph),
 * so the plate's size is live.
 */
export function useHighlightBoxes(
  highlight: ShowHighlight | null,
  moving: boolean,
): HighlightUi | null {
  const [measured, setMeasured] = useMeasuredState(NOTHING);
  const query = highlight && !highlight.page ? highlight.queries.join(', ') : '';
  const page = !!highlight?.page;

  useLayoutEffect(() => {
    if (!query && !page) return;
    const update = () => setMeasured(measureTarget(page, query));
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [query, page, setMeasured]);

  useFollowFrames((!!query || page) && moving, () => setMeasured(measureTarget(page, query)));

  if (!highlight) return null;
  const { key, phase } = highlight;
  return { key, phase, page, ...measured };
}
