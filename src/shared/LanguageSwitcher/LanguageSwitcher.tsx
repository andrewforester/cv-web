import { commonStrings, LOCALES, useStrings, type Locale } from '../../i18n';
import styles from './LanguageSwitcher.module.css';
import { languageSwitcherTestIds } from './testIds';

interface LanguageSwitcherProps {
  className?: string;
  locale: Locale;
  onChange: (locale: Locale) => void;
}

/** EN / UA toggle. Stateless: the current locale comes in, the choice goes out. */
export function LanguageSwitcher({ className, locale, onChange }: LanguageSwitcherProps) {
  const strings = useStrings(commonStrings);
  const labels: Record<Locale, string> = { en: strings.languageEn, uk: strings.languageUk };

  return (
    <div
      role="group"
      aria-label={strings.languageSwitcherLabel}
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-testid={languageSwitcherTestIds.root}
    >
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          className={styles.option}
          aria-pressed={option === locale}
          data-testid={languageSwitcherTestIds.option(option)}
          onClick={() => onChange(option)}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  );
}
