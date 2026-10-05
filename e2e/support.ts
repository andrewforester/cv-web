import type { Page } from '@playwright/test';

/** Screenshots land here; CI uploads the folder as the `web-smoke-screenshots` artifact. */
export const SCREENSHOT_DIR = 'web-check';

/** Today's site (the default since Round 5; `?retro=0` kept explicit) and the show (src/app/retroMode). */
export const NORMAL_SITE = './?retro=0';
export const SHOW_SITE = './?retro=1';

/** A page's show and the same page as today's site: the show is compared with the latter. */
export interface ShowUrls {
  show: string;
  normal: string;
}

/** The one page's show (docs/retro/ARCHITECTURE.md §11). */
export const SHOW_URLS: ShowUrls = { show: SHOW_SITE, normal: NORMAL_SITE };

/** Page errors and console errors; a web check fails on any. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}
