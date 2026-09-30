import { useLayoutEffect, useState } from 'react';
import type { DecorationBox } from './RetroShowUiState';
import type { DecorationId } from './scenario';

/**
 * Decoration geometry from docs/design/retro/SPEC.md → Decorations (the note's width and offsets,
 * the footer's height). Like the decorations' look, these are the show's retro furniture, not tokens.
 */
const NOTE = { width: 184, marginRight: 28, belowHeader: 40, abovePhoto: 12 };
const FOOTER_HEIGHT = 200;

const ANCHORS = {
  cv: "[data-retro-stage] [data-testid='cv']",
  main: '[data-retro-stage] main',
  header: "[data-retro-stage] [data-agent-id='section:header']",
  photo: "[data-retro-stage] [data-agent-id='section:header'] > img",
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
function place(layoutShifted: boolean): Placement {
  const cv = pageBox(ANCHORS.cv);
  if (!cv) return {};
  const placement: Placement = {
    'top-bar': { left: cv.left, top: cv.top, width: cv.width },
    'page-footer': { left: cv.left, top: cv.bottom - FOOTER_HEIGHT, width: cv.width },
  };
  const main = pageBox(ANCHORS.main);
  const header = pageBox(ANCHORS.header);
  const photo = pageBox(ANCHORS.photo);
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

const same = (a: Placement, b: Placement) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Measures the decorations' anchors on the page (stable hooks only) and keeps them in place while
 * layers come off, the CV loads, fonts arrive or the window resizes.
 */
export function useDecorationPlacement(layersKey: string, layoutShifted: boolean): Placement {
  const [placement, setPlacement] = useState<Placement>({});

  useLayoutEffect(() => {
    const update = () =>
      setPlacement((current) => {
        const next = place(layoutShifted);
        return same(current, next) ? current : next;
      });
    update();
    window.addEventListener('resize', update);
    void document.fonts?.ready.then(update);
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null;
    observer?.observe(document.body);
    return () => {
      window.removeEventListener('resize', update);
      observer?.disconnect();
    };
  }, [layersKey, layoutShifted]);

  return placement;
}
