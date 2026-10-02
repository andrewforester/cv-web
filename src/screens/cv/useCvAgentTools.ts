import { useAgentTools, type AgentToolHandlers } from '../../agent';
import { AGENT_SECTION_IDS, type AgentContactChannel, type AgentTargetId } from '../../data/chat';
import { OK, openLink, targetToolHandlers, useAgentPageView } from '../../shared/agentTarget';
import { contactHref } from './contactLinks';
import type { CvUiState } from './CvUiState';

/**
 * Registers the CV page's tools while the CV is shown (`ready`). Executors only dispatch: scroll
 * through the `data-agent-id` element, highlight through state. `openContact` is `confirm: true`,
 * so the registry has already asked the visitor (chat-supplied callback) when it runs. The page's
 * view (section in view, highlighted target) goes into every question's snapshot.
 */
export function useCvAgentTools(state: CvUiState, highlight: (id: AgentTargetId) => void): void {
  const cv = state.status === 'ready' ? state.cv : null;
  const handlers: AgentToolHandlers = cv
    ? {
        ...targetToolHandlers(highlight),
        openContact: ({ channel }) => {
          openLink(contactHref(cv.header.contacts, channel as AgentContactChannel));
          return OK;
        },
      }
    : {};
  useAgentTools(handlers);
  useAgentPageView(AGENT_SECTION_IDS, state.status === 'ready' ? state.highlightedId : null);
}
