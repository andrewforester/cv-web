import { useAgentTools } from '../agent';
import { useLocale, type Locale } from '../i18n';
import { ChatRoute } from '../screens/chat/ChatRoute';
import { CvRoute } from '../screens/cv/CvRoute';
import { ProfileRoute } from '../screens/profile/ProfileRoute';
import { LanguageSwitcher } from '../shared/LanguageSwitcher/LanguageSwitcher';
import { pageFor } from './routes';

/**
 * App shell: the page for the URL (`/` the CV, `/new` the profile) with the language switcher in
 * its meta bar, and the floating AI chat.
 */
export function App() {
  const { locale, setLocale } = useLocale();
  useAgentTools({
    switchLanguage: ({ locale: next }) => {
      setLocale(next as Locale);
      return { ok: true };
    },
  });

  const switcher = <LanguageSwitcher locale={locale} onChange={setLocale} />;

  const isProfile = pageFor(window.location.pathname) === 'profile';
  // Both pages are Forest pages that lay themselves out; the switcher sits in their meta bar.
  return (
    <>
      <main>
        {isProfile ? <ProfileRoute metaBarEnd={switcher} /> : <CvRoute metaBarEnd={switcher} />}
      </main>
      <ChatRoute />
    </>
  );
}
