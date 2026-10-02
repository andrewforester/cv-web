import { useEffect, type ReactNode } from 'react';
import { useCvRepository, useProfileRepository } from '../data';
import {
  buildAgentToolSpecs,
  buildProfileToolSpecs,
  type AgentToolSpec,
  type ChatPage,
} from '../data/chat';
import { AgentRegistryContext } from './AgentRegistryContext';
import type { AgentToolRegistry } from './AgentToolRegistry';

interface AgentProviderProps {
  registry: AgentToolRegistry;
  /** The page on screen: its catalogue is the one the chat may call. */
  page: ChatPage;
  children: ReactNode;
}

/**
 * Provides the registry and fills its catalogue from the page's data: the CV on `/`, the profile
 * on `/new` (ids are the same in every locale, so the English data is enough). Until it loads,
 * every tool answers `not_available`.
 */
export function AgentProvider({ registry, page, children }: AgentProviderProps) {
  const cvRepository = useCvRepository();
  const profileRepository = useProfileRepository();

  useEffect(() => {
    let active = true;
    const catalogue: Promise<AgentToolSpec[]> =
      page === 'profile'
        ? profileRepository.getProfile('en').then(buildProfileToolSpecs)
        : cvRepository.getCv('en').then(buildAgentToolSpecs);
    catalogue.then(
      (specs) => active && registry.setCatalogue(specs),
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [page, cvRepository, profileRepository, registry]);

  return <AgentRegistryContext value={registry}>{children}</AgentRegistryContext>;
}
