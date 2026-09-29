import { createContext, useContext } from 'react';
import type { AgentToolRegistry } from './AgentToolRegistry';

export const AgentRegistryContext = createContext<AgentToolRegistry | null>(null);

/** The page's tool registry: screens register into it, the chat executes through it. */
export function useAgentRegistry(): AgentToolRegistry {
  const registry = useContext(AgentRegistryContext);
  if (!registry) throw new Error('useAgentRegistry must be used inside AgentProvider');
  return registry;
}
