import type { Page } from '@playwright/test';

/** Screenshots land here; CI uploads the folder as the `web-smoke-screenshots` artifact. */
export const SCREENSHOT_DIR = 'web-check';

/** Today's site: English desktop browsers would otherwise get the retro show (src/app/retroMode). */
export const NORMAL_SITE = './?retro=0';
export const SHOW_SITE = './?retro=1';

/** Page errors and console errors; a web check fails on any. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}
