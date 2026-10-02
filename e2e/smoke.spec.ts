import { expect, test } from '@playwright/test';
import { collectErrors, NORMAL_SITE, SCREENSHOT_DIR } from './support';

const cases = [
  { locale: 'en', browserLocale: 'en-US', name: 'Andrew Panasiuk' },
  // Ukrainian falls back to the English texts until they are translated.
  { locale: 'uk', browserLocale: 'uk-UA', name: 'Andrew Panasiuk' },
] as const;

for (const { locale, browserLocale, name } of cases) {
  test.describe(`cv (${locale})`, () => {
    test.use({ locale: browserLocale });

    test('renders without errors', async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto(NORMAL_SITE);

      await expect(page.getByTestId('cv-name')).toHaveText(name);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/home-${locale}.png`, fullPage: true });
      expect(errors).toEqual([]);
    });
  });
}

const profileCases = [
  { locale: 'en', browserLocale: 'en-US', name: 'Andrew Panasiuk' },
  { locale: 'uk', browserLocale: 'uk-UA', name: 'Андрій Панасюк' },
] as const;

for (const { locale, browserLocale, name } of profileCases) {
  test.describe(`profile /new (${locale})`, () => {
    test.use({ locale: browserLocale });

    test('loads directly and renders without errors', async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto('./new');

      await expect(page.getByTestId('forest-name')).toHaveText(name);
      await expect(page.getByTestId('cv')).toHaveCount(0);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/new-${locale}.png`, fullPage: true });
      expect(errors).toEqual([]);
    });

    test('fits a phone screen', async ({ page }) => {
      const errors = collectErrors(page);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('./new');

      await expect(page.getByTestId('forest-name')).toHaveText(name);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBe(0);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/new-${locale}-mobile.png`,
        fullPage: true,
      });
      expect(errors).toEqual([]);
    });
  });
}

test('language switcher changes the page language', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(NORMAL_SITE);
  await page.getByTestId('language-switcher-uk').click();

  await expect(page.getByTestId('cv-name')).toHaveText('Andrew Panasiuk');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
  expect(errors).toEqual([]);
});
