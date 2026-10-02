import { useLayoutEffect } from 'react';
import type { DecorationBox } from './RetroShowUiState';
import type { DecorationId } from './scenario';
import type { DecorationAnchors } from './scenarios';
import { useFollowFrames } from './useFollowFrames';
import { useMeasuredState } from './useMeasuredState';

/**
 * Decoration geometry from docs/design/retro/SPEC.md → Decorations (the note's width and offsets,
 * the footer's height). Like the decorations' look, these are the show's retro furniture, not tokens.
 */
const NOTE = { width: 184, marginRight: 28, belowHeader: 40, abovePhoto: 12 };
const FOOTER_HEIGHT = 200;

const STAGE = '[data-retro-stage]';
/** Anchors every page shares: the page's `main` and the Forest photo. */
const SHARED_ANCHORS = {
  main: `${STAGE} main`,
  photo: `${STAGE} [data-testid='forest-photo']`,
};

type Placement = Partial<Record<DecorationId, DecorationBox>>;

function pageBox(selector: string) {
  const element = document.querySelector(selector);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  const left = rect.left + window.scrollX;
  const top = rect.top + window.scrollY;
  return { left, top, right: left + rect.width, bottom: top + rect.height, width: rect.width };
}

/** Where each decoration goes now; the note moves to the photo once the layout is fixed. */
function place(anchors: DecorationAnchors, layoutShifted: boolean): Placement {
  const root = pageBox(`${STAGE} ${anchors.root}`);
  if (!root) return {};
  const placement: Placement = {
    'top-bar': { left: root.left, top: root.top, width: root.width },
    'page-footer': { left: root.left, top: root.bottom - FOOTER_HEIGHT, width: root.width },
  };
  const main = pageBox(SHARED_ANCHORS.main);
  const header = pageBox(`${STAGE} ${anchors.header}`);
  const photo = pageBox(SHARED_ANCHORS.photo);
  if (layoutShifted && main && header) {
    placement['oh-snap'] = {
      left: main.right + NOTE.marginRight,
      top: header.top + NOTE.belowHeader,
    };
  } else if (photo) {
    placement['oh-snap'] = {
      left: photo.right + NOTE.marginRight - NOTE.width,
      top: photo.top - NOTE.abovePhoto,
    };
  }
  return placement;
}

/**
 * Measures the decorations' anchors on the page (stable hooks only) and keeps them in place while
 * layers come off, the page loads, fonts arrive or the window resizes, and every animation frame
 * while a change is `moving` the page (a fade or a morph just applied).
 */
export function useDecorationPlacement(
  anchors: DecorationAnchors,
  layersKey: string,
  layoutShifted: boolean,
  moving: boolean,
): Placement {
  const [placement, setPlacement] = useMeasuredState<Placement>({});

  useLayoutEffect(() => {
    const update = () => setPlacement(place(anchors, layoutShifted));
    update();
    window.addEventListener('resize', update);
    void document.fonts?.ready.then(update);
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null;
    observer?.observe(document.body);
    return () => {
      window.removeEventListener('resize', update);
      observer?.disconnect();
    };
  }, [anchors, layersKey, layoutShifted, setPlacement]);

  useFollowFrames(moving, () => setPlacement(place(anchors, layoutShifted)));

  return placement;
}
