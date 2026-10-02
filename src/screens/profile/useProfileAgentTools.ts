import { useAgentTools, type AgentToolHandlers } from '../../agent';
import type { Profile } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { OK, openLink, targetToolHandlers } from '../../shared/agentTarget';
import { profileContactHref } from './profileTargets';

/**
 * Registers `/new`'s tools while the profile is shown (`profile` set), like the CV page does:
 * scroll and highlight through the `data-agent-id` elements, and open a contact (email or phone;
 * the registry has already asked the visitor, `confirm: true`). Switching the language is the app
 * shell's tool on both pages.
 */
export function useProfileAgentTools(
  profile: Profile | null,
  highlight: (id: AgentTargetId) => void,
): void {
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
}
