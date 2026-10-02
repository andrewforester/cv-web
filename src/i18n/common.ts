import { defineStrings } from './strings';

/** Shared `common` namespace: texts used by more than one screen. Owner: Theme. */
export const commonStrings = defineStrings({
  en: {
    languageSwitcherLabel: 'Language',
    languageEn: 'EN',
    languageUk: 'UA',
    loading: 'Loading…',
    loadError: 'Could not load the CV.',
    showCase: 'Show case',
  },
  uk: {
    languageSwitcherLabel: 'Мова',
    languageEn: 'EN',
    languageUk: 'UA',
    loading: 'Завантаження…',
    loadError: 'Не вдалося завантажити резюме.',
    showCase: 'Show case',
  },
});
