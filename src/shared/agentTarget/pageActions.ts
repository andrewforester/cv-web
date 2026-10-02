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
