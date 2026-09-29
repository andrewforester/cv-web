import { createContext, useContext } from 'react';
import type { AgentToolExecutor } from '../../data/chat';

/**
 * The page's tools as the chat sees them. Provided by the client registry (GRA-34, `src/agent/`);
 * TODO(GRA-34): bind the registry's executor here (or replace this context with its hook) once it
 * lands. Until then nothing is provided and the chat runs without page tools.
 */
export const AgentExecutorContext = createContext<AgentToolExecutor | null>(null);

const NO_TOOLS: AgentToolExecutor = {
  specs: () => [],
  available: () => [],
  execute: () => Promise.resolve({ ok: false, error: 'not_available' }),
};

export function useAgentExecutor(): AgentToolExecutor {
  return useContext(AgentExecutorContext) ?? NO_TOOLS;
}
