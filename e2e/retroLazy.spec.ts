import { expect, test } from '@playwright/test';
import { collectErrors, NORMAL_SITE } from './support';

// The Retro Rebuild show is a lazy chunk (src/app/useLazyShow): normal visitors never download it.
// The show-mode cases (no flash before the broken page, a failed chunk) come back with `retro-4`
// (CV-107 Build split → T6); until then the page has no show.
test.use({ locale: 'en-US' });

const SHOW_CHUNK = /\/assets\/RetroShowRoute-[\w-]+\.(js|css)$/;

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
