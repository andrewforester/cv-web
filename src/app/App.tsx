import { useLocale } from '../i18n';
import { ChatRoute } from '../screens/chat/ChatRoute';
import { CvRoute } from '../screens/cv/CvRoute';
import { LanguageSwitcher } from '../shared/LanguageSwitcher/LanguageSwitcher';
import styles from './App.module.css';

/** App shell: header with the language switcher, the CV page, and the floating AI chat. */
export function App() {
  const { locale, setLocale } = useLocale();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <LanguageSwitcher locale={locale} onChange={setLocale} />
      </header>
      <main className={styles.main}>
        <CvRoute />
      </main>
      <ChatRoute />
    </div>
  );
}
