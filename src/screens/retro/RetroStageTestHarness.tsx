import type { ReactNode } from 'react';
import { useLocale } from '../../i18n';
import { LanguageSwitcher } from '../../shared/LanguageSwitcher/LanguageSwitcher';
import { CvRoute } from '../cv/CvRoute';
import styles from './RetroStageTestHarness.module.css';

/**
 * The stage the shell (R5) gives the show (docs/retro/ARCHITECTURE.md §6): the real `CvRoute` in a
 * shell carrying `data-retro-stage`, with the switcher header the `hide-header` layer targets.
 * For tests and the dev harness only; the app's own shell lives in `src/app`.
 */
export function RetroStageTestHarness({
  staged = true,
  children,
}: {
  staged?: boolean;
  children?: ReactNode;
}) {
  const { locale, setLocale } = useLocale();
  return (
    <>
      <div className={styles.shell} data-retro-stage={staged ? '' : undefined}>
        <header className={styles.header} data-testid="app-header">
          <LanguageSwitcher locale={locale} onChange={setLocale} />
        </header>
        <main className={styles.main}>
          <CvRoute />
        </main>
      </div>
      {children}
    </>
  );
}
