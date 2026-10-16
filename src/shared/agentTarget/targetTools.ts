import type { AgentToolHandlers } from '../../agent';
import type { AgentTargetId, AgentToolResult } from '../../data/chat';
import { scrollToTarget } from './pageActions';

export const OK: AgentToolResult = { ok: true };
const UNKNOWN_TARGET: AgentToolResult = { ok: false, error: 'unknown_target' };

/**
 * The page's `scrollToSection` and `highlightElement` executors: they only dispatch, scrolling to
 * the `data-agent-id` element and pointing the screen's highlight at it. The model's input was
 * already checked against the page's catalogue by the registry.
 */
export function targetToolHandlers(
  highlight: (id: AgentTargetId) => void,
): Required<Pick<AgentToolHandlers, 'scrollToSection' | 'highlightElement'>> {
  return {
    scrollToSection: ({ section }) =>
      scrollToTarget(`section:${String(section)}`) ? OK : UNKNOWN_TARGET,
    highlightElement: ({ target }) => {
      const id = target as AgentTargetId;
      if (!scrollToTarget(id)) return UNKNOWN_TARGET;
      highlight(id);
      return OK;
    },
  };
}
