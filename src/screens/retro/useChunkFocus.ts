import { useEffect, useRef } from 'react';
import { targetQuery, type CurrentChunk } from './engine/chunkSelectors';
import { TIMING } from './engine/timing';
import type { ShowDispatch } from './useShowRunner';

/** A target this tall counts as in view once this much of it shows (SPEC → Scrolling). */
const IN_VIEW_PX = 160;
/** The show's own scroll is over after this long without scroll events (no `scrollend` needed). */
const SCROLL_IDLE_MS = 150;

function inView(rect: DOMRect): boolean {
  const visible = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
  return visible > 0 && visible >= Math.min(rect.height / 2, IN_VIEW_PX);
}

/** Where the target's top lands: `--agent-scroll-margin-top` below the viewport top, as reachable. */
function landingTop(rect: DOMRect): number {
  const root = document.documentElement;
  const margin = parseFloat(getComputedStyle(root).getPropertyValue('--agent-scroll-margin-top'));
  const top = rect.top + window.scrollY - (margin || 0);
  return Math.max(0, Math.min(top, root.scrollHeight - window.innerHeight));
}

/** The chunk that may need the camera: typing, with a target that isn't the whole page. */
function aimOf(chunk: CurrentChunk | null): { key: string; query: string } | null {
  if (chunk?.status !== 'typing' || !chunk.target || chunk.target.selectors === 'page') return null;
  return { key: chunk.key, query: chunk.target.selectors.map(targetQuery).join(', ') };
}

/**
 * The show's camera (SPEC → Show what changed → Scrolling): when a chunk starts, its first target
 * (in page order) is scrolled to if it is out of view, unless the visitor scrolled in the last 4 s;
 * then `focusSettled` lets the chunk apply (at once when there is nothing to scroll). It never
 * moves focus; with reduced motion it jumps.
 */
export function useChunkFocus(
  chunk: CurrentChunk | null,
  reducedMotion: boolean,
  dispatch: ShowDispatch,
) {
  const visitorScrollAt = useRef(-Infinity);
  const ownScroll = useRef(false);
  useEffect(() => {
    let idle: ReturnType<typeof setTimeout> | undefined;
    const onScrollEnd = () => {
      clearTimeout(idle);
      ownScroll.current = false;
    };
    const onScroll = () => {
      if (!ownScroll.current) {
        visitorScrollAt.current = Date.now();
        return;
      }
      clearTimeout(idle);
      idle = setTimeout(onScrollEnd, SCROLL_IDLE_MS);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scrollend', onScrollEnd);
    return () => {
      clearTimeout(idle);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scrollend', onScrollEnd);
    };
  }, []);

  const aim = aimOf(chunk);
  const key = aim?.key;
  const query = aim?.query;
  useEffect(() => {
    if (!key || !query) return;
    const settle = () => dispatch({ type: 'focusSettled', key });
    const rect = document.querySelector(query)?.getBoundingClientRect();
    const quiet = Date.now() - visitorScrollAt.current >= TIMING.visitorScrollQuietMs;
    const top = rect ? landingTop(rect) : window.scrollY;
    const hidden = !rect || (!rect.width && !rect.height);
    if (hidden || inView(rect) || !quiet || Math.abs(top - window.scrollY) < 1) {
      settle();
      return;
    }
    // The runner applies after its settle cap anyway; `scrollend` only lets it apply sooner.
    ownScroll.current = true;
    dispatch({ type: 'focusScrolling', key });
    const onScrollEnd = () => settle();
    window.addEventListener('scrollend', onScrollEnd, { once: true });
    window.scrollTo({ top, behavior: reducedMotion ? 'instant' : 'smooth' });
    return () => window.removeEventListener('scrollend', onScrollEnd);
  }, [key, query, reducedMotion, dispatch]);
}
