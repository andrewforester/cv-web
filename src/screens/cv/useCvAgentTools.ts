import { useAgentTools, type AgentToolHandlers } from '../../agent';
import type { Cv } from '../../data';
import type { AgentContactChannel, AgentTargetId } from '../../data/chat';
import { OK, openLink, targetToolHandlers } from '../../shared/agentTarget';
import { contactHref } from './contactLinks';

/**
 * Registers the CV page's tools while the CV is shown (`cv` set). Executors only dispatch: scroll
 * through the `data-agent-id` element, highlight through state. `openContact` is `confirm: true`,
 * so the registry has already asked the visitor (chat-supplied callback) when it runs.
 */
export function useCvAgentTools(cv: Cv | null, highlight: (id: AgentTargetId) => void): void {
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
}
