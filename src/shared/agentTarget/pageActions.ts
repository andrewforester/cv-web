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
const READING_LINE = 1 / 4;

/**
 * The page section the visitor is reading: the one of `sections` whose top is the closest above
 * the reading line, or the topmost one when all are below it. Reads only `section:<id>` targets
 * of `sections`, so the result is always one of them; `null` when none is on the page.
 */
export function sectionInView<T extends string>(sections: readonly T[]): T | null {
  const byTop = sections
    .flatMap((id) => {
      const element = document.querySelector(`[data-agent-id="section:${id}"]`);
      return element ? [{ id, top: element.getBoundingClientRect().top }] : [];
    })
    .sort((a, b) => a.top - b.top);
  const line = window.innerHeight * READING_LINE;
  return (byTop.filter(({ top }) => top <= line).at(-1) ?? byTop[0])?.id ?? null;
}
