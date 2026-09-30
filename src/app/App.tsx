import { useCallback, useMemo, useState } from 'react';
import { useAgentTools } from '../agent';
import { useLocale, type Locale } from '../i18n';
import { CvRoute } from '../screens/cv/CvRoute';
import { RetroShowRoute } from '../screens/retro/RetroShowRoute';
import { LanguageSwitcher } from '../shared/LanguageSwitcher/LanguageSwitcher';
import styles from './App.module.css';
import { markRetroDone } from './retroMode';
import { useLazyChat } from './useLazyChat';
import { useRetroMode } from './useRetroMode';

/**
 * App shell: header with the language switcher, the CV page, and the floating AI chat. In show
 * mode the Retro Rebuild show runs over the same tree (`data-retro-stage`), so `CvRoute` never
 * remounts; the show loads the AI chat at its last step.
 */
export function App() {
  const { locale, setLocale } = useLocale();
  useAgentTools({
    switchLanguage: ({ locale: next }) => {
      setLocale(next as Locale);
      return { ok: true };
    },
  });

  const mode = useRetroMode();
  const [showing, setShowing] = useState(mode === 'show');
  // Normal mode loads the chat at start; after a show it is already there (or loads if skipped).
  const { Chat, load } = useLazyChat(!showing);
  const loaders = useMemo(() => ({ 'ai-chat': load }), [load]);
  const onDone = useCallback(() => {
    markRetroDone();
    setShowing(false);
  }, []);

  return (
    <>
      <div className={styles.shell} data-retro-stage={showing ? '' : undefined}>
        <header className={styles.header} data-testid="app-header">
          <LanguageSwitcher locale={locale} onChange={setLocale} />
        </header>
        <main className={styles.main}>
          <CvRoute />
        </main>
        {Chat && <Chat />}
      </div>
      {showing && <RetroShowRoute loaders={loaders} onDone={onDone} />}
    </>
  );
}
