import { useEffect, type ReactNode } from 'react';
import { useCvPageRepository } from '../data';
import { buildCvPageToolSpecs } from '../data/chat';
import { AgentRegistryContext } from './AgentRegistryContext';
import type { AgentToolRegistry } from './AgentToolRegistry';

interface AgentProviderProps {
  registry: AgentToolRegistry;
  children: ReactNode;
}

/**
 * Provides the registry and fills its catalogue from the one page's data (ADR-0006), so the chat
 * may only name the page's sections and items. Until it loads, every tool answers `not_available`.
 */
export function AgentProvider({ registry, children }: AgentProviderProps) {
  const repository = useCvPageRepository();

  useEffect(() => {
    let active = true;
    repository.getCvPage().then(
      (page) => active && registry.setCatalogue(buildCvPageToolSpecs(page)),
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [repository, registry]);

  return <AgentRegistryContext value={registry}>{children}</AgentRegistryContext>;
}
