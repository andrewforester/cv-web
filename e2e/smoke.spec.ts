import { expect, test } from '@playwright/test';
import { collectErrors, SCREENSHOT_DIR } from './support';

// Both pages are Forest pages: `/` the CV (its content is English in both locales until
// translated), `/new` the profile.
const pages = [
  {
    path: './',
    shot: 'home',
    root: 'cv',
    other: 'profile',
    names: { en: 'Andrew Panasiuk', uk: 'Andrew Panasiuk' },
  },
  {
    path: './new',
    shot: 'new',
    root: 'profile',
    other: 'cv',
    names: { en: 'Andrew Panasiuk', uk: 'Андрій Панасюк' },
  },
] as const;

const locales = [
  { locale: 'en', browserLocale: 'en-US' },
  { locale: 'uk', browserLocale: 'uk-UA' },
] as const;

for (const { path, shot, root, other, names } of pages) {
  for (const { locale, browserLocale } of locales) {
    test.describe(`${path} (${locale})`, () => {
      test.use({ locale: browserLocale });

      test('loads directly and renders without errors', async ({ page }) => {
        const errors = collectErrors(page);
        await page.goto(path);

        await expect(page.getByTestId('forest-name')).toHaveText(names[locale]);
        await expect(page.getByTestId(root)).toHaveCount(1);
        await expect(page.getByTestId(other)).toHaveCount(0);
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/${shot}-${locale}.png`, fullPage: true });
        expect(errors).toEqual([]);
      });

      test('fits a phone screen', async ({ page }) => {
        const errors = collectErrors(page);
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(path);

        await expect(page.getByTestId('forest-name')).toHaveText(names[locale]);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBe(0);
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/${shot}-${locale}-mobile.png`,
          fullPage: true,
        });
        expect(errors).toEqual([]);
      });
    });
  }
}

test('language switcher changes the page language', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('./');
  await page.getByTestId('language-switcher-uk').click();

  await expect(page.getByRole('heading', { name: '01 — Навички' })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
  expect(errors).toEqual([]);
});
