import { useState, type ReactNode } from 'react';
import { CvRepositoryContext, StaticCvRepository, type CvRepository } from '../data';
import { I18nProvider, type Locale } from '../i18n';

interface AppProvidersProps {
  children: ReactNode;
  /** Test seams: a fake repository and a fixed locale. */
  repository?: CvRepository;
  locale?: Locale;
}

/** The data binding lives here: swap `StaticCvRepository` for a backend implementation. */
export function AppProviders({ children, repository, locale }: AppProvidersProps) {
  const [cvRepository] = useState<CvRepository>(() => repository ?? new StaticCvRepository());

  return (
    <I18nProvider initial={locale}>
      <CvRepositoryContext value={cvRepository}>{children}</CvRepositoryContext>
    </I18nProvider>
  );
}
