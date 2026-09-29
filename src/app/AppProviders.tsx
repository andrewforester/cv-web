import { useState, type ReactNode } from 'react';
import { CvRepositoryContext, StaticCvRepository, type CvRepository } from '../data';
import { ChatRepositoryContext, HttpChatRepository, type ChatRepository } from '../data/chat';
import { I18nProvider, type Locale } from '../i18n';

interface AppProvidersProps {
  children: ReactNode;
  /** Test seams: fake repositories and a fixed locale. */
  repository?: CvRepository;
  chatRepository?: ChatRepository;
  locale?: Locale;
}

/** The data bindings live here: swap an implementation (e.g. `StaticCvRepository`) in one line. */
export function AppProviders({ children, repository, chatRepository, locale }: AppProvidersProps) {
  const [cvRepository] = useState<CvRepository>(() => repository ?? new StaticCvRepository());
  const [chat] = useState<ChatRepository>(() => chatRepository ?? new HttpChatRepository());

  return (
    <I18nProvider initial={locale}>
      <CvRepositoryContext value={cvRepository}>
        <ChatRepositoryContext value={chat}>{children}</ChatRepositoryContext>
      </CvRepositoryContext>
    </I18nProvider>
  );
}
