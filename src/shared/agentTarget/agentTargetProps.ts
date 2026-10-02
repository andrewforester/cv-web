import type { AgentTargetId, AgentTargetKind } from '../../data/chat';
import './agentTarget.css';

/**
 * Props that make an element an agent target: `data-agent-id="<kind>:<id>"` (how executors find
 * it) and, while it is the highlighted one, `data-agent-highlighted` (styled by `agentTarget.css`).
 */
export function agentTargetProps(
  kind: AgentTargetKind,
  id: string,
  highlightedId: AgentTargetId | null,
) {
  const agentId: AgentTargetId = `${kind}:${id}`;
  return {
    'data-agent-id': agentId,
    'data-agent-highlighted': agentId === highlightedId ? '' : undefined,
  };
}
