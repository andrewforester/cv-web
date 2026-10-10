import { expect, test } from '@playwright/test';
import { collectErrors, screenshotPath } from './support';

// The one CV page (docs/design/v3), English only. `/new` is a redirect to `/` on Vercel; locally
// `vite preview` serves the same app for it, which shows the same page.
test.use({ locale: 'en-US' });

test('loads directly and renders without errors @prod @mobile', async ({ page, isMobile }) => {
  const errors = collectErrors(page);
  await page.goto('./');

  await expect(page.getByTestId('home-name')).toHaveText('Andrew Panasiuk');
  await expect(page.getByTestId('home-job')).toHaveCount(9);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByTestId('show-case')).toHaveCount(0);
  if (isMobile) {
    // The phone never scrolls sideways.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  }
  await page.screenshot({ path: screenshotPath('home', isMobile), fullPage: true });
  expect(errors).toEqual([]);
});

test('/new shows the same page @prod', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('./new');

  await expect(page.getByTestId('home-name')).toHaveText('Andrew Panasiuk');
  await expect(page.getByTestId('home')).toHaveCount(1);
  // Production redirects /new to /; against the local preview the same app serves /new itself.
  if (process.env.PW_BASE_URL) expect(new URL(page.url()).pathname).toBe('/');
  expect(errors).toEqual([]);
});
