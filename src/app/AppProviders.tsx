import { useState, type ReactNode } from 'react';
import { AgentProvider, AgentToolRegistry } from '../agent';
import {
  CvPageRepositoryContext,
  CvRepositoryContext,
  ProfileRepositoryContext,
  StaticCvRepository,
  type CvPageRepository,
  type CvRepository,
  type ProfileRepository,
} from '../data';
import { ChatRepositoryContext, HttpChatRepository, type ChatRepository } from '../data/chat';
import { ShowRepositoryContext, type ShowRepository } from '../data/retro';
import { HttpShowRepository } from '../data/retro/HttpShowRepository';
import { I18nProvider, type Locale } from '../i18n';
import type { RetroMode } from './retroMode';
import { pageFor, type Page } from './routes';
import { RetroModeContext } from './RetroModeContext';

interface AppProvidersProps {
  children: ReactNode;
  /** Test seams: fake repositories, a fixed locale, retro mode and page (default: from the URL). */
  repository?: CvRepository;
  profileRepository?: ProfileRepository;
  cvPageRepository?: CvPageRepository;
  chatRepository?: ChatRepository;
  showRepository?: ShowRepository;
  agentRegistry?: AgentToolRegistry;
  locale?: Locale;
  retroMode?: RetroMode;
  page?: Page;
}

/** The data bindings live here: swap an implementation (e.g. `StaticCvRepository`) in one line. */
export function AppProviders({
  children,
  repository,
  profileRepository,
  cvPageRepository,
  chatRepository,
  showRepository,
  agentRegistry,
  locale,
  retroMode,
  page = pageFor(window.location.pathname),
}: AppProvidersProps) {
  // One static instance serves every seam until a backend replaces it.
  const [{ cvRepository, profile, cvPage }] = useState(() => {
    const staticRepository = new StaticCvRepository();
    return {
      cvRepository: repository ?? staticRepository,
      profile: profileRepository ?? staticRepository,
      cvPage: cvPageRepository ?? staticRepository,
    };
  });
  const [chat] = useState<ChatRepository>(() => chatRepository ?? new HttpChatRepository());
  const [show] = useState<ShowRepository>(() => showRepository ?? new HttpShowRepository());
  const [registry] = useState(() => agentRegistry ?? new AgentToolRegistry());

  return (
    <I18nProvider initial={locale}>
      <CvRepositoryContext value={cvRepository}>
        <ProfileRepositoryContext value={profile}>
          <CvPageRepositoryContext value={cvPage}>
            <ChatRepositoryContext value={chat}>
              <ShowRepositoryContext value={show}>
                <RetroModeContext value={retroMode}>
                  <AgentProvider registry={registry} page={page}>
                    {children}
                  </AgentProvider>
                </RetroModeContext>
              </ShowRepositoryContext>
            </ChatRepositoryContext>
          </CvPageRepositoryContext>
        </ProfileRepositoryContext>
      </CvRepositoryContext>
    </I18nProvider>
  );
}
