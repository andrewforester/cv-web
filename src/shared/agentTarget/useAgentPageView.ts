import { useAgentView } from '../../agent';
import type { AgentPageState, AgentTargetId } from '../../data/chat';
import { sectionInView } from './pageActions';

/**
 * Offers the page's view to the chat while the screen is mounted: the section of `sections` in
 * view (read from the page when a question is sent) and the target the agent highlights now.
 */
export function useAgentPageView(
  sections: readonly NonNullable<AgentPageState['activeSection']>[],
  highlightedId: AgentTargetId | null,
): void {
  useAgentView(() => ({ activeSection: sectionInView(sections), highlighted: highlightedId }));
}
