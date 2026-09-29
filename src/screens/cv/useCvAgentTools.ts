import { useAgentTools, type AgentToolHandlers } from '../../agent';
import type { Cv } from '../../data';
import type {
  AgentContactChannel,
  AgentSectionId,
  AgentTargetId,
  AgentToolResult,
} from '../../data/chat';
import { contactHref } from './contactLinks';

const OK: AgentToolResult = { ok: true };
const UNKNOWN_TARGET: AgentToolResult = { ok: false, error: 'unknown_target' };

/** Scrolls the target into view (smooth; instant under reduced motion); false if it is absent. */
function scrollToTarget(id: AgentTargetId): boolean {
  const element = document.querySelector(`[data-agent-id="${id}"]`);
  if (!element) return false;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  element.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
  return true;
}

/** Mailto/tel navigate; chat links open in a new tab without an opener. */
function openLink(href: string): void {
  if (href.startsWith('http')) window.open(href, '_blank', 'noopener');
  else window.location.href = href;
}

/**
 * Registers the CV page's tools while the CV is shown (`cv` set). Executors only dispatch: scroll
 * through the `data-agent-id` element, highlight through state. `openContact` is `confirm: true`,
 * so the registry has already asked the visitor (chat-supplied callback) when it runs.
 */
export function useCvAgentTools(cv: Cv | null, highlight: (id: AgentTargetId) => void): void {
  const handlers: AgentToolHandlers = cv
    ? {
        scrollToSection: ({ section }) =>
          scrollToTarget(`section:${section as AgentSectionId}`) ? OK : UNKNOWN_TARGET,
        highlightElement: ({ target }) => {
          const id = target as AgentTargetId;
          if (!scrollToTarget(id)) return UNKNOWN_TARGET;
          highlight(id);
          return OK;
        },
        openContact: ({ channel }) => {
          openLink(contactHref(cv.header.contacts, channel as AgentContactChannel));
          return OK;
        },
      }
    : {};
  useAgentTools(handlers);
}
