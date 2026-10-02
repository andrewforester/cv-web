import { useAgentTools } from '../agent';
import { useLocale, type Locale } from '../i18n';
import { ChatRoute } from '../screens/chat/ChatRoute';
import { CvRoute } from '../screens/cv/CvRoute';
import { ProfileRoute } from '../screens/profile/ProfileRoute';
import { LanguageSwitcher } from '../shared/LanguageSwitcher/LanguageSwitcher';
import styles from './App.module.css';
import { pageFor } from './routes';

/**
 * App shell: the page for the URL with the language switcher (the CV: in a header above it;
 * `/new`: in the page's meta bar), and the floating AI chat.
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

  if (pageFor(window.location.pathname) === 'profile') {
    // The Forest page lays itself out; the switcher sits at the right end of its meta bar.
    return (
      <>
        <main>
          <ProfileRoute metaBarEnd={switcher} />
        </main>
        <ChatRoute />
      </>
    );
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>{switcher}</header>
      <main className={styles.main}>
        <CvRoute />
      </main>
      <ChatRoute />
    </div>
  );
}
