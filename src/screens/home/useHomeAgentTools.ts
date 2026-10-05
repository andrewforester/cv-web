import { useAgentTools, type AgentToolHandlers } from '../../agent';
import { OK, openLink, targetToolHandlers, useAgentPageView } from '../../shared/agentTarget';
import { CV_SECTION_IDS, type AgentTargetId } from '../../data/chat';
import { contactFor } from './homeTargets';
import type { HomeUiState } from './HomeUiState';

/**
 * Registers the page's tools while it is shown (`ready`): scroll and highlight through the
 * `data-agent-id` elements, and open a contact (the registry has already asked the visitor,
 * `confirm: true`). The section in view and the highlighted target go into every question's
 * snapshot.
 */
export function useHomeAgentTools(
  state: HomeUiState,
  highlight: (id: AgentTargetId) => void,
): void {
  const page = state.status === 'ready' ? state.page : null;
  const handlers: AgentToolHandlers = page
    ? {
        ...targetToolHandlers(highlight),
        openContact: ({ channel }) => {
          const contact = contactFor(page.contacts, String(channel));
          if (!contact) return { ok: false, error: 'unknown_target' };
          openLink(contact.href);
          return OK;
        },
      }
    : {};
  useAgentTools(handlers);
  const highlighted = state.status === 'ready' ? state.highlightedId : null;
  useAgentPageView(CV_SECTION_IDS, highlighted);
}
