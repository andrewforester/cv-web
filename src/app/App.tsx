import { useLocale } from '../i18n';
import { HomeRoute } from '../screens/home/HomeRoute';
import { LanguageSwitcher } from '../shared/LanguageSwitcher/LanguageSwitcher';
import styles from './App.module.css';

/** App shell: header with the language switcher, then the (single, for now) screen. */
export function App() {
  const { locale, setLocale } = useLocale();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <LanguageSwitcher locale={locale} onChange={setLocale} />
      </header>
      <main className={styles.main}>
        <HomeRoute />
      </main>
    </div>
  );
}
