import { createContext, useContext, useEffect } from 'react';
import { useAgentRegistry } from '../../agent';
import type { AgentToolExecutor } from '../../data/chat';

/**
 * Test seam: when provided, it wins over the page's registry (`FakeAgentExecutor` in tests).
 * In the app nothing provides it and the chat runs the registry from `AgentProvider`.
 */
export const AgentExecutorContext = createContext<AgentToolExecutor | null>(null);

/**
 * The page's tools as the chat sees them. The chat shows its own confirmation card before it
 * executes a `confirm` tool, so the registry's own confirmation is set to always agree.
 */
export function useAgentExecutor(): AgentToolExecutor {
  const registry = useAgentRegistry();
  const provided = useContext(AgentExecutorContext);
  useEffect(() => registry.setConfirm(() => Promise.resolve(true)), [registry]);
  return provided ?? registry;
}
