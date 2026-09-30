import { expect, test } from '@playwright/test';
import { collectErrors, NORMAL_SITE, SCREENSHOT_DIR, SHOW_SITE } from './support';

// The Retro Rebuild show is a lazy chunk (src/app/useLazyShow): normal visitors never download it,
// and show visitors never see a frame of today's design before the broken page.
test.use({ locale: 'en-US' });

const SHOW_CHUNK = /\/assets\/RetroShowRoute-[\w-]+\.(js|css)$/;

interface FrameCounts {
  /** The shell was hidden (the show's chunk still loading). */
  hidden: number;
  /** The shell was visible without damage layers: today's design, a flash. */
  flash: number;
  /** The shell was visible with damage layers: the broken page. */
  broken: number;
}

declare global {
  interface Window {
    retroFrames?: FrameCounts;
  }
}

test('normal mode never requests the show chunk', async ({ page }) => {
  const errors = collectErrors(page);
  const requested: string[] = [];
  page.on('request', (request) => requested.push(request.url()));

  await page.goto(NORMAL_SITE);
  await expect(page.getByTestId('chat-fab')).toBeVisible();
  await page.waitForLoadState('networkidle');

  expect(requested.filter((url) => SHOW_CHUNK.test(new URL(url).pathname))).toEqual([]);
  expect(errors).toEqual([]);
});

test('show mode: hidden while the chunk loads, then the broken page from the first frame', async ({
  page,
}) => {
  const errors = collectErrors(page);
  // Samples every animation frame (what the browser is about to paint) until the page is broken.
  await page.addInitScript(() => {
    const frames = { hidden: 0, flash: 0, broken: 0 };
    window.retroFrames = frames;
    const probe = () => {
      const shell = document.querySelector('[data-testid="app-header"]')?.parentElement;
      if (shell) {
        if (getComputedStyle(shell).visibility !== 'visible') frames.hidden++;
        else if (document.querySelector('style[data-retro-layer]')) frames.broken++;
        else frames.flash++;
      }
      if (!frames.broken) requestAnimationFrame(probe);
    };
    requestAnimationFrame(probe);
  });
  let release = () => {};
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route(SHOW_CHUNK, async (route) => {
    await held;
    await route.continue();
  });

  await page.goto(SHOW_SITE);
  await expect(page.getByTestId('cv-name')).toBeAttached();
  await expect(page.getByTestId('cv-name')).toBeHidden();
  await page.screenshot({ path: `${SCREENSHOT_DIR}/retro-loading.png` });

  release();
  await expect(page.locator('style[data-retro-layer]').first()).toBeAttached();
  await expect(page.getByTestId('cv-name')).toBeVisible();
  await page.screenshot({ path: `${SCREENSHOT_DIR}/retro-first-frame.png` });

  const frames = await page.evaluate(() => window.retroFrames);
  expect(frames?.hidden).toBeGreaterThan(0);
  expect(frames?.broken).toBeGreaterThan(0);
  expect(frames?.flash).toBe(0);
  expect(errors).toEqual([]);
});

test('a show chunk that fails to load leaves the normal site, without an uncaught error', async ({
  page,
}) => {
  const uncaught: string[] = [];
  page.on('pageerror', (error) => uncaught.push(error.message));
  await page.route(SHOW_CHUNK, (route) => route.abort('internetdisconnected'));

  await page.goto(SHOW_SITE);

  await expect(page.getByTestId('chat-fab')).toBeVisible();
  await expect(page.getByTestId('cv-name')).toBeVisible();
  await expect(page.locator('[data-retro-stage], style[data-retro-layer]')).toHaveCount(0);
  expect(await page.evaluate(() => sessionStorage.getItem('retro.done'))).toBe('1');
  expect(uncaught).toEqual([]);
});
