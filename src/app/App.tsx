import { useMemo } from 'react';
import { useAgentTools } from '../agent';
import { useLocale, type Locale } from '../i18n';
import { CvRoute } from '../screens/cv/CvRoute';
import { ProfileRoute } from '../screens/profile/ProfileRoute';
import { LanguageSwitcher } from '../shared/LanguageSwitcher/LanguageSwitcher';
import styles from './App.module.css';
import { pageFor } from './routes';
import { useLazyChat } from './useLazyChat';
import { useRetroMode } from './useRetroMode';
import { useShowCase } from './useShowCase';

/**
 * App shell: the page for the URL with the language switcher (the CV: in a header above it;
 * `/new`: in the page's meta bar), and the floating AI chat. When the Retro Rebuild show is started
 * over the CV (`?retro=1`, or `useShowCase`'s `start` for the Show case button) it runs over the
 * same tree (`data-retro-stage`), so `CvRoute` never remounts; the AI chat is off the page until the
 * show's last step loads it. The show is a lazy chunk: at a `?retro=1` load the shell stays hidden
 * until it has loaded, so the first visible frame is already the broken page. `/new` has no show.
 */
export function App() {
  const { locale, setLocale } = useLocale();
  useAgentTools({
    switchLanguage: ({ locale: next }) => {
      setLocale(next as Locale);
      return { ok: true };
    },
  });

  const page = pageFor(window.location.pathname);
  const retroMode = useRetroMode();
  // Its `start` is the seam for the Show case button (R24).
  const { showing, pending, Show, end } = useShowCase(page === 'cv' && retroMode === 'show');
  // Today's site loads the chat at start; after a show it is already there (or loads if it failed).
  const { Chat, load } = useLazyChat(!showing && !pending);
  const loaders = useMemo(() => ({ 'ai-chat': load }), [load]);
  const switcher = <LanguageSwitcher locale={locale} onChange={setLocale} />;

  if (page === 'profile') {
    // The Forest page lays itself out; the switcher sits at the right end of its meta bar.
    return (
      <>
        <main>
          <ProfileRoute metaBarEnd={switcher} />
        </main>
        {Chat && <Chat />}
      </>
    );
  }

  return (
    <>
      <div
        className={pending ? `${styles.shell} ${styles.pending}` : styles.shell}
        data-retro-stage={showing ? '' : undefined}
      >
        <header className={styles.header} data-testid="app-header">
          {switcher}
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
