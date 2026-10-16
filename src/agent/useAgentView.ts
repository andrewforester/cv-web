import { useEffect, useRef } from 'react';
import type { AgentViewSource } from './AgentToolRegistry';
import { useAgentRegistry } from './AgentRegistryContext';

/**
 * Makes `source` the page's view (section in view, highlighted target) while the calling
 * component is mounted. The latest `source` is read when the chat asks, never on every render.
 */
export function useAgentView(source: AgentViewSource): void {
  const registry = useAgentRegistry();
  const latest = useRef(source);
  useEffect(() => {
    latest.current = source;
  });
  useEffect(() => registry.setViewSource(() => latest.current()), [registry]);
}
