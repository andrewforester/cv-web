import { useState, type ReactNode } from 'react';
import { AgentProvider, AgentToolRegistry } from '../agent';
import {
  CvRepositoryContext,
  ProfileRepositoryContext,
  StaticCvRepository,
  type CvRepository,
  type ProfileRepository,
} from '../data';
import { ChatRepositoryContext, HttpChatRepository, type ChatRepository } from '../data/chat';
import { ShowRepositoryContext, type ShowRepository } from '../data/retro';
import { HttpShowRepository } from '../data/retro/HttpShowRepository';
import { I18nProvider, type Locale } from '../i18n';
import type { RetroMode } from './retroMode';
import { RetroModeContext } from './RetroModeContext';

interface AppProvidersProps {
  children: ReactNode;
  /** Test seams: fake repositories, a fixed locale and a fixed retro mode. */
  repository?: CvRepository;
  profileRepository?: ProfileRepository;
  chatRepository?: ChatRepository;
  showRepository?: ShowRepository;
  agentRegistry?: AgentToolRegistry;
  locale?: Locale;
  retroMode?: RetroMode;
}

/** The data bindings live here: swap an implementation (e.g. `StaticCvRepository`) in one line. */
export function AppProviders({
  children,
  repository,
  profileRepository,
  chatRepository,
  showRepository,
  agentRegistry,
  locale,
  retroMode,
}: AppProvidersProps) {
  // One static instance serves both seams until a backend replaces it.
  const [{ cvRepository, profile }] = useState(() => {
    const staticRepository = new StaticCvRepository();
    return {
      cvRepository: repository ?? staticRepository,
      profile: profileRepository ?? staticRepository,
    };
  });
  const [chat] = useState<ChatRepository>(() => chatRepository ?? new HttpChatRepository());
  const [show] = useState<ShowRepository>(() => showRepository ?? new HttpShowRepository());
  const [registry] = useState(() => agentRegistry ?? new AgentToolRegistry());

  return (
    <I18nProvider initial={locale}>
      <CvRepositoryContext value={cvRepository}>
        <ProfileRepositoryContext value={profile}>
          <ChatRepositoryContext value={chat}>
            <ShowRepositoryContext value={show}>
              <RetroModeContext value={retroMode}>
                <AgentProvider registry={registry}>{children}</AgentProvider>
              </RetroModeContext>
            </ShowRepositoryContext>
          </ChatRepositoryContext>
        </ProfileRepositoryContext>
      </CvRepositoryContext>
    </I18nProvider>
  );
}
