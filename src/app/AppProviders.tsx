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
import { I18nProvider, type Locale } from '../i18n';

interface AppProvidersProps {
  children: ReactNode;
  /** Test seams: fake repositories and a fixed locale. */
  repository?: CvRepository;
  profileRepository?: ProfileRepository;
  chatRepository?: ChatRepository;
  agentRegistry?: AgentToolRegistry;
  locale?: Locale;
}

/** The data bindings live here: swap an implementation (e.g. `StaticCvRepository`) in one line. */
export function AppProviders({
  children,
  repository,
  profileRepository,
  chatRepository,
  agentRegistry,
  locale,
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
  const [registry] = useState(() => agentRegistry ?? new AgentToolRegistry());

  return (
    <I18nProvider initial={locale}>
      <CvRepositoryContext value={cvRepository}>
        <ProfileRepositoryContext value={profile}>
          <ChatRepositoryContext value={chat}>
            <AgentProvider registry={registry}>{children}</AgentProvider>
          </ChatRepositoryContext>
        </ProfileRepositoryContext>
      </CvRepositoryContext>
    </I18nProvider>
  );
}
