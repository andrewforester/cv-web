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
 * App shell: the page for the URL (`/` the CV, `/new` the profile) with the language switcher in
 * its meta bar, and the floating AI chat. When the Retro Rebuild show is started over the CV
 * (`?retro=1`, or `useShowCase`'s `start` for the Show case button) it runs over the same tree
 * (`data-retro-stage`), so `CvRoute` never remounts; the AI chat is off the page until the show's
 * last step loads it. The show is a lazy chunk: at a `?retro=1` load the shell stays hidden until
 * it has loaded, so the first visible frame is already the broken page. `/new` has no show.
 */
export function App() {
  const { locale, setLocale } = useLocale();
  useAgentTools({
    switchLanguage: ({ locale: next }) => {
      setLocale(next as Locale);
      return { ok: true };
    },
  });

  const isProfile = pageFor(window.location.pathname) === 'profile';
  const retroMode = useRetroMode();
  // Its `start` is the seam for the Show case button (R24).
  const { showing, pending, Show, end } = useShowCase(!isProfile && retroMode === 'show');
  // Today's site loads the chat at start; after a show it is already there (or loads if it failed).
  const { Chat, load } = useLazyChat(!showing && !pending);
  const loaders = useMemo(() => ({ 'ai-chat': load }), [load]);
  const switcher = <LanguageSwitcher locale={locale} onChange={setLocale} />;

  // Both pages are Forest pages that lay themselves out; the switcher sits in their meta bar.
  return (
    <>
      <div
        className={pending ? styles.pending : undefined}
        data-retro-stage={showing ? '' : undefined}
      >
        <main>
          {isProfile ? <ProfileRoute metaBarEnd={switcher} /> : <CvRoute metaBarEnd={switcher} />}
        </main>
        {Chat && <Chat />}
      </div>
      {showing && Show && <Show loaders={loaders} onDone={end} />}
    </>
  );
}
