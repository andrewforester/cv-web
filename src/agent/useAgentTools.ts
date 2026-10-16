import { useEffect, useRef } from 'react';
import type { AgentToolName } from '../data/chat';
import type { AgentToolHandler } from './AgentToolRegistry';
import { useAgentRegistry } from './AgentRegistryContext';

export type AgentToolHandlers = Partial<Record<AgentToolName, AgentToolHandler>>;

/**
 * Registers the handlers while the calling component is mounted and unregisters them on unmount.
 * Handlers may change every render (the latest one runs); the set of names should not.
 */
export function useAgentTools(handlers: AgentToolHandlers): void {
  const registry = useAgentRegistry();
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  const names = Object.keys(handlers).sort().join(',');
  useEffect(() => {
    const unregister = names
      .split(',')
      .filter(Boolean)
      .map((name) =>
        registry.register(name as AgentToolName, (input) => {
          const handler = latest.current[name as AgentToolName];
          return handler ? handler(input) : { ok: false, error: 'not_available' };
        }),
      );
    return () => unregister.forEach((fn) => fn());
  }, [registry, names]);
}
