import { useEffect, type ReactNode } from 'react';
import { useCvRepository } from '../data';
import { buildAgentToolSpecs } from '../data/chat';
import { AgentRegistryContext } from './AgentRegistryContext';
import type { AgentToolRegistry } from './AgentToolRegistry';

interface AgentProviderProps {
  registry: AgentToolRegistry;
  children: ReactNode;
}

/**
 * Provides the registry and fills its catalogue from the CV (ids are the same in every locale,
 * so the English CV is enough). Until it loads, every tool answers `not_available`.
 */
export function AgentProvider({ registry, children }: AgentProviderProps) {
  const repository = useCvRepository();

  useEffect(() => {
    let active = true;
    repository.getCv('en').then(
      (cv) => active && registry.setCatalogue(buildAgentToolSpecs(cv)),
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [repository, registry]);

  return <AgentRegistryContext value={registry}>{children}</AgentRegistryContext>;
}
