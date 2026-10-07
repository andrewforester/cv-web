import { defineStrings } from './strings';

/** Shared `common` namespace: texts used by more than one screen. Owner: Theme. */
export const commonStrings = defineStrings({
  en: {
    loading: 'Loading…',
    loadError: 'Could not load the CV.',
    showCase: 'Show case',
    showCaseLink: 'Show old version with some fun',
  },
});
