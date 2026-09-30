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

test('language switcher changes the page language', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(NORMAL_SITE);
  await page.getByTestId('language-switcher-uk').click();

  await expect(page.getByTestId('cv-name')).toHaveText('Andrew Panasiuk');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
  expect(errors).toEqual([]);
});
