import { useAgentTools, type AgentToolHandlers } from '../../agent';
import { PROFILE_SECTION_IDS, type AgentTargetId } from '../../data/chat';
import { OK, openLink, targetToolHandlers, useAgentPageView } from '../../shared/agentTarget';
import { profileContactHref } from './profileTargets';
import type { ProfileUiState } from './ProfileUiState';

/**
 * Registers `/new`'s tools while the profile is shown (`ready`), like the CV page does: scroll
 * and highlight through the `data-agent-id` elements, and open a contact (email or phone; the
 * registry has already asked the visitor, `confirm: true`). Switching the language is the app
 * shell's tool on both pages. The page's view (section in view, highlighted target) goes into
 * every question's snapshot.
 */
export function useProfileAgentTools(
  state: ProfileUiState,
  highlight: (id: AgentTargetId) => void,
): void {
  const profile = state.status === 'ready' ? state.profile : null;
  const handlers: AgentToolHandlers = profile
    ? {
        ...targetToolHandlers(highlight),
        openContact: ({ channel }) => {
          const href = profileContactHref(profile, String(channel));
          if (!href) return { ok: false, error: 'unknown_target' };
          openLink(href);
          return OK;
        },
      }
    : {};
  useAgentTools(handlers);
  useAgentPageView(PROFILE_SECTION_IDS, state.status === 'ready' ? state.highlightedId : null);
}
