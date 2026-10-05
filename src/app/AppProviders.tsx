import { useState, type ReactNode } from 'react';
import { AgentProvider, AgentToolRegistry } from '../agent';
import { CvPageRepositoryContext, StaticCvRepository, type CvPageRepository } from '../data';
import { ChatRepositoryContext, HttpChatRepository, type ChatRepository } from '../data/chat';
import { ShowRepositoryContext, type ShowRepository } from '../data/retro';
import { HttpShowRepository } from '../data/retro/HttpShowRepository';
import type { RetroMode } from './retroMode';
import { RetroModeContext } from './RetroModeContext';

interface AppProvidersProps {
  children: ReactNode;
  /** Test seams: fake repositories and a fixed retro mode. */
  cvPageRepository?: CvPageRepository;
  chatRepository?: ChatRepository;
  showRepository?: ShowRepository;
  agentRegistry?: AgentToolRegistry;
  retroMode?: RetroMode;
}

/** The data bindings live here: swap an implementation (e.g. `StaticCvRepository`) in one line. */
export function AppProviders({
  children,
  cvPageRepository,
  chatRepository,
  showRepository,
  agentRegistry,
  retroMode,
}: AppProvidersProps) {
  const [cvPage] = useState<CvPageRepository>(() => cvPageRepository ?? new StaticCvRepository());
  const [chat] = useState<ChatRepository>(() => chatRepository ?? new HttpChatRepository());
  const [show] = useState<ShowRepository>(() => showRepository ?? new HttpShowRepository());
  const [registry] = useState(() => agentRegistry ?? new AgentToolRegistry());

  return (
    <CvPageRepositoryContext value={cvPage}>
      <ChatRepositoryContext value={chat}>
        <ShowRepositoryContext value={show}>
          <RetroModeContext value={retroMode}>
            <AgentProvider registry={registry}>{children}</AgentProvider>
          </RetroModeContext>
        </ShowRepositoryContext>
      </ChatRepositoryContext>
    </CvPageRepositoryContext>
  );
}
