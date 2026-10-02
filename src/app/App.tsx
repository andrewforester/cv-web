import { useMemo } from 'react';
import { useAgentTools } from '../agent';
import { useLocale, type Locale } from '../i18n';
import { CvRoute } from '../screens/cv/CvRoute';
import { LanguageSwitcher } from '../shared/LanguageSwitcher/LanguageSwitcher';
import styles from './App.module.css';
import { useLazyChat } from './useLazyChat';
import { useRetroMode } from './useRetroMode';
import { useShowCase } from './useShowCase';

/**
 * App shell: header with the language switcher, the CV page, and the floating AI chat. When the
 * Retro Rebuild show is started (`?retro=1`, or `showCase.start` for the Show case button) it runs
 * over the same tree (`data-retro-stage`), so `CvRoute` never remounts; the AI chat is off the page
 * until the show's last step loads it. The show is a lazy chunk: at a `?retro=1` load the shell
 * stays hidden until it has loaded, so the first visible frame is already the broken page.
 */
export function App() {
  const { locale, setLocale } = useLocale();
  useAgentTools({
    switchLanguage: ({ locale: next }) => {
      setLocale(next as Locale);
      return { ok: true };
    },
  });

  // `showCase.start` is the seam for the Show case button (R24).
  const showCase = useShowCase(useRetroMode() === 'show');
  const { showing, pending, Show, end } = showCase;
  // Today's site loads the chat at start; after a show it is already there (or loads if it failed).
  const { Chat, load } = useLazyChat(!showing && !pending);
  const loaders = useMemo(() => ({ 'ai-chat': load }), [load]);

  return (
    <>
      <div
        className={pending ? `${styles.shell} ${styles.pending}` : styles.shell}
        data-retro-stage={showing ? '' : undefined}
      >
        <header className={styles.header} data-testid="app-header">
          <LanguageSwitcher locale={locale} onChange={setLocale} />
        </header>
        <main className={styles.main}>
          <CvRoute />
        </main>
        {Chat && <Chat />}
      </div>
      {showing && Show && <Show loaders={loaders} onDone={end} />}
    </>
  );
}
