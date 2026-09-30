import type { Locale } from '../i18n';

/** `show`: the Retro Rebuild show runs over the CV; `normal`: today's site. */
export type RetroMode = 'show' | 'normal';

/** Set when a show ends, so the rest of the browser session gets the normal site. */
export const RETRO_DONE_KEY = 'retro.done';
export const RETRO_PARAM = 'retro';
export const DESKTOP_QUERY = '(min-width: 1024px)';

export interface RetroModeInput {
  /** `location.search`. */
  search: string;
  locale: Locale;
  desktop: boolean;
  done: boolean;
}

/**
 * docs/retro/ARCHITECTURE.md §6: `?retro=1` forces the show and `?retro=0` skips it; otherwise
 * English desktop visitors get it once per browser session.
 */
export function decideRetroMode({ search, locale, desktop, done }: RetroModeInput): RetroMode {
  const param = new URLSearchParams(search).get(RETRO_PARAM);
  if (param === '1') return 'show';
  if (param === '0') return 'normal';
  return locale === 'en' && desktop && !done ? 'show' : 'normal';
}

/** The mode for this page load, read from the window (jsdom has no `matchMedia`: normal). */
export function readRetroMode(locale: Locale): RetroMode {
  return decideRetroMode({
    search: window.location.search,
    locale,
    desktop: typeof window.matchMedia === 'function' && window.matchMedia(DESKTOP_QUERY).matches,
    done: readSession(RETRO_DONE_KEY) !== null,
  });
}

export function markRetroDone(): void {
  try {
    sessionStorage.setItem(RETRO_DONE_KEY, '1');
  } catch {
    // Storage can be unavailable (private mode); the next load then shows the show again.
  }
}

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
