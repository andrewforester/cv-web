import { useAgentView, type AgentPageView } from '../../agent';
import type { AgentTargetId } from '../../data/chat';
import { sectionInView } from './pageActions';

/**
 * Offers the page's view to the chat while the screen is mounted: the section of `sections` in
 * view (read from the page when a question is sent) and the target the agent highlights now.
 */
export function useAgentPageView(
  sections: readonly NonNullable<AgentPageView['activeSection']>[],
  highlightedId: AgentTargetId | null,
): void {
  useAgentView(() => ({ activeSection: sectionInView(sections), highlighted: highlightedId }));
}
