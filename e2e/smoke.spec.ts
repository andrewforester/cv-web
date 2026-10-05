import { expect, test } from '@playwright/test';
import { collectErrors, SCREENSHOT_DIR } from './support';

// The one CV page (docs/design/v3), English only. `/new` is a redirect to `/` on Vercel; locally
// `vite preview` serves the same app for it, which shows the same page.
test.use({ locale: 'en-US' });

test('loads directly and renders without errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('./');

  await expect(page.getByTestId('home-name')).toHaveText('Andrew Panasiuk');
  await expect(page.getByTestId('home-job')).toHaveCount(9);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByTestId('home-meta-bar').getByTestId('show-case')).toBeVisible();
  await page.screenshot({ path: `${SCREENSHOT_DIR}/home.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test('fits a phone screen', async ({ page }) => {
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');

  await expect(page.getByTestId('home-name')).toHaveText('Andrew Panasiuk');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/home-mobile.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test('/new shows the same page', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('./new');

  await expect(page.getByTestId('home-name')).toHaveText('Andrew Panasiuk');
  await expect(page.getByTestId('home')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test.describe('a Ukrainian browser', () => {
  test.use({ locale: 'uk-UA' });

  test('gets the English page', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('./');

    await expect(page.getByTestId('home-name')).toHaveText('Andrew Panasiuk');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect(errors).toEqual([]);
  });
});
