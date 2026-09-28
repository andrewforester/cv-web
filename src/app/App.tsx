import { useLocale } from '../i18n';
import { CvRoute } from '../screens/cv/CvRoute';
import { LanguageSwitcher } from '../shared/LanguageSwitcher/LanguageSwitcher';
import styles from './App.module.css';

/** App shell: header with the language switcher, then the CV page. */
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
    </div>
  );
}
