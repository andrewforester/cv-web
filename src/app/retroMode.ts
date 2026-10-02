/** `show`: the page opens with the Retro Rebuild show; `normal`: today's site. */
export type RetroMode = 'show' | 'normal';

export const RETRO_PARAM = 'retro';

/**
 * docs/retro/ARCHITECTURE.md §9 → Round 5: the show starts on request only. At page load that is
 * `?retro=1` (dev, e2e); later the shell's start function (`useShowCase`). Anything else is today's
 * site (`?retro=0` included).
 */
export function decideRetroMode(search: string): RetroMode {
  return new URLSearchParams(search).get(RETRO_PARAM) === '1' ? 'show' : 'normal';
}

/** The mode for this page load, read from the URL. */
export function readRetroMode(): RetroMode {
  return decideRetroMode(window.location.search);
}
