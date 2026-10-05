import { expect, test } from '@playwright/test';
import { collectErrors, SCREENSHOT_DIR } from './support';

// Both pages are Forest pages: `/` the CV, `/new` the profile. The site is English only.
const pages = [
  {
    path: './',
    shot: 'home',
    root: 'cv',
    other: 'profile',
    name: 'Andrew Panasiuk',
  },
  {
    path: './new',
    shot: 'new',
    root: 'profile',
    other: 'cv',
    name: 'Andrew Panasiuk',
  },
] as const;

for (const { path, shot, root, other, name } of pages) {
  test.describe(path, () => {
    test.use({ locale: 'en-US' });

    test('loads directly and renders without errors', async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto(path);

      await expect(page.getByTestId('forest-name')).toHaveText(name);
      await expect(page.getByTestId(root)).toHaveCount(1);
      await expect(page.getByTestId(other)).toHaveCount(0);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/${shot}-en.png`, fullPage: true });
      expect(errors).toEqual([]);
    });

    test('fits a phone screen', async ({ page }) => {
      const errors = collectErrors(page);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path);

      await expect(page.getByTestId('forest-name')).toHaveText(name);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBe(0);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/${shot}-en-mobile.png`, fullPage: true });
      expect(errors).toEqual([]);
    });
  });
}

test.describe('a Ukrainian browser', () => {
  test.use({ locale: 'uk-UA' });

  test('gets the English page without a language switcher', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('./new');

    await expect(page.getByTestId('forest-name')).toHaveText('Andrew Panasiuk');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByTestId('language-switcher')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});
