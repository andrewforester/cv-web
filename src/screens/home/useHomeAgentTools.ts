import { useAgentTools, type AgentToolHandlers } from '../../agent';
import type { AgentTargetId, CvSectionId } from '../../data/chat';
import { OK, openLink, targetToolHandlers, useAgentPageView } from '../../shared/agentTarget';
import { contactFor } from './homeTargets';
import type { HomeUiState } from './HomeUiState';

/**
 * The sections the chat's snapshot can name today. TODO(CV-111): `CV_SECTION_IDS` once the
 * agent's view is typed on v4; v2's section union has no `craft` or `contacts`, so those read as
 * the section above them.
 */
const VIEW_SECTIONS = [
  'header',
  'loop',
  'impact',
  'experience',
  'skills',
  'education',
  'about',
] as const satisfies readonly CvSectionId[];

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
  useAgentPageView(VIEW_SECTIONS, state.status === 'ready' ? state.highlightedId : null);
}
