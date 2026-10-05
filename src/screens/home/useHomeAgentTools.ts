import { useAgentTools, useAgentView, type AgentToolHandlers } from '../../agent';
import { OK, openLink, targetToolHandlers } from '../../shared/agentTarget';
import type { AgentTargetId } from '../../data/chat';
import { contactFor } from './homeTargets';
import type { HomeUiState } from './HomeUiState';

/**
 * Registers the page's tools while it is shown (`ready`): scroll and highlight through the
 * `data-agent-id` elements, and open a contact (the registry has already asked the visitor,
 * `confirm: true`). The highlighted target goes into every question's snapshot.
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
  // TODO(CV-111): report the section in view (`CV_SECTION_IDS`) once the agent's view is typed
  // on v4; v2's section union has no `craft` or `contacts`.
  useAgentView(() => ({ activeSection: null, highlighted }));
}
