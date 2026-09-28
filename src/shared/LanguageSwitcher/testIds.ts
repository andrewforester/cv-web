import type { Locale } from '../../i18n';

export const languageSwitcherTestIds = {
  root: 'language-switcher',
  option: (locale: Locale) => `language-switcher-${locale}`,
} as const;
