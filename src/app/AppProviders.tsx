import { useState, type ReactNode } from 'react';
import { AgentProvider, AgentToolRegistry } from '../agent';
import { CvPageRepositoryContext, StaticCvRepository, type CvPageRepository } from '../data';
import { ChatRepositoryContext, HttpChatRepository, type ChatRepository } from '../data/chat';
import { ShowRepositoryContext, type ShowRepository } from '../data/retro';
import { HttpShowRepository } from '../data/retro/HttpShowRepository';
import {
  HttpVoiceSessionRepository,
  VoiceClientContext,
  VoiceSessionRepositoryContext,
  type VoiceClient,
  type VoiceSessionRepository,
} from '../data/voice';
import type { RetroMode } from './retroMode';
import { RetroModeContext } from './RetroModeContext';
import { createVoiceClient, readVoiceMode } from './voiceMode';

interface AppProvidersProps {
  children: ReactNode;
  /** Test seams: fake repositories, a fixed retro mode, a voice client (`null` = voice off). */
  cvPageRepository?: CvPageRepository;
  chatRepository?: ChatRepository;
  showRepository?: ShowRepository;
  agentRegistry?: AgentToolRegistry;
  retroMode?: RetroMode;
  voiceClient?: VoiceClient | null;
  voiceSessionRepository?: VoiceSessionRepository;
}

/** The data bindings live here: swap an implementation (e.g. `StaticCvRepository`) in one line. */
export function AppProviders({
  children,
  cvPageRepository,
  chatRepository,
  showRepository,
  agentRegistry,
  retroMode,
  voiceClient,
  voiceSessionRepository,
}: AppProvidersProps) {
  const [cvPage] = useState<CvPageRepository>(() => cvPageRepository ?? new StaticCvRepository());
  const [chat] = useState<ChatRepository>(() => chatRepository ?? new HttpChatRepository());
  const [show] = useState<ShowRepository>(() => showRepository ?? new HttpShowRepository());
  const [registry] = useState(() => agentRegistry ?? new AgentToolRegistry());
  // The voice flag (docs/voice/SYSTEM_DESIGN.md §9): `null` = no mic button.
  const [voice] = useState<VoiceClient | null>(() =>
    voiceClient === undefined ? createVoiceClient(readVoiceMode()) : voiceClient,
  );
  const [voiceSession] = useState<VoiceSessionRepository>(
    () => voiceSessionRepository ?? new HttpVoiceSessionRepository(),
  );

  return (
    <CvPageRepositoryContext value={cvPage}>
      <ChatRepositoryContext value={chat}>
        <ShowRepositoryContext value={show}>
          <VoiceClientContext value={voice}>
            <VoiceSessionRepositoryContext value={voiceSession}>
              <RetroModeContext value={retroMode}>
                <AgentProvider registry={registry}>{children}</AgentProvider>
              </RetroModeContext>
            </VoiceSessionRepositoryContext>
          </VoiceClientContext>
        </ShowRepositoryContext>
      </ChatRepositoryContext>
    </CvPageRepositoryContext>
  );
}
