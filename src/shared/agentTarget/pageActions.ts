import type { AgentTargetId } from '../../data/chat';

/** Scrolls the target into view (smooth; instant under reduced motion); false if it is absent. */
export function scrollToTarget(id: AgentTargetId): boolean {
  const element = document.querySelector(`[data-agent-id="${id}"]`);
  if (!element) return false;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  element.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
  return true;
}

/** Mailto/tel navigate; chat links open in a new tab without an opener. */
export function openLink(href: string): void {
  if (href.startsWith('http')) window.open(href, '_blank', 'noopener');
  else window.location.href = href;
}

/** The reading line, as a share of the viewport height from its top. */
const READING_LINE = 1 / 3;
/** Closer than this to the end of the page counts as the end. */
const PAGE_END_PX = 2;

/**
 * The page section the visitor is reading: the one of `sections` (page order) whose top is the
 * closest above the reading line, or at the end of the page the last one on screen. Reads only
 * `section:<id>` targets of `sections`, so the result is always one of them; `null` when none is
 * on the page.
 */
export function sectionInView<T extends string>(sections: readonly T[]): T | null {
  const tops = sections.flatMap((id) => {
    const element = document.querySelector(`[data-agent-id="section:${id}"]`);
    return element ? [{ id, top: element.getBoundingClientRect().top }] : [];
  });
  if (tops.length === 0) return null;
  const lowest = (list: typeof tops) => list.reduce((a, b) => (b.top >= a.top ? b : a)).id;
  const height = window.innerHeight;
  const atEnd =
    window.scrollY > 0 &&
    window.scrollY + height >= document.documentElement.scrollHeight - PAGE_END_PX;
  const onScreen = tops.filter(({ top }) => top < height);
  if (atEnd && onScreen.length > 0) return lowest(onScreen);
  const above = tops.filter(({ top }) => top <= height * READING_LINE);
  if (above.length > 0) return lowest(above);
  return tops.reduce((a, b) => (b.top < a.top ? b : a)).id;
}
