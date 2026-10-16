import { expect, test } from '@playwright/test';
import {
  expectEndsAsNormalSite,
  expectShownIsApplied,
  MIN_SHOW_MS,
  SHOW_LIMIT_MS,
  stageSelector,
} from './retroShow';
import { collectErrors, screenshotPath, SHOW_URLS } from './support';

// The Show case end to end (docs/retro/ARCHITECTURE.md §11 → Guards): the v3 page opens as its
// 2001 version and the show fixes it, on the page's `home-*` hooks and v3 tokens, until it is the
// real page. The show runs fully scripted (automation gets no LLM), so nothing here needs a model.
test.use({ locale: 'en-US' });

test.describe('with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('at t = 0 the page is the broken 2001 page, alone @mobile', async ({ page, isMobile }) => {
    const errors = collectErrors(page);
    await page.clock.install();
    await page.goto(SHOW_URLS.show);
    await expect(page.locator(stageSelector)).toHaveCount(1);
    await expect(page.getByTestId('home')).toBeVisible();
    // Every layer and the three decorations; no dock, no chat yet.
    await expect(page.locator('style[data-retro-layer]')).toHaveCount(32);
    await expect(page.locator('#top-bar, #page-footer, #oh-snap')).toHaveCount(3);
    await expect(page.locator('#top-bar')).toContainText('Senior Software Product Engineer');
    await expect(page.locator('#page-footer')).toContainText('AI Builders Webring');
    await expect(page.getByTestId('home-meta-bar')).toBeHidden();
    await expect(page.getByTestId('retro-dock')).toHaveCount(0);
    await page.screenshot({ path: screenshotPath('retro-start', isMobile) });
    await page.screenshot({ path: screenshotPath('retro-start-full', isMobile), fullPage: true });
    expect(errors).toEqual([]);
  });

  test('guard 4: after every chunk, what the console printed is what the page has', async ({
    page,
  }) => {
    await expectShownIsApplied(page, SHOW_URLS, 'retro-mid.png');
  });

  test('guard 3: the show ends on the normal page, AI chat included', async ({ page }) => {
    await expectEndsAsNormalSite(page, SHOW_URLS, 'retro-end.png');
  });
});

test('with motion on the show ends on the normal page within its time budget', async ({ page }) => {
  const showMs = await expectEndsAsNormalSite(page, SHOW_URLS);

  // Timing smoke: 36 chunks with their beats take ≈ 91 s; far less means chunks got skipped.
  expect(showMs).toBeLessThanOrEqual(SHOW_LIMIT_MS);
  expect(showMs).toBeGreaterThan(MIN_SHOW_MS);
});

test('the footer link starts the show (CV-148)', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(SHOW_URLS.normal);
  await expect(page.getByTestId('home-copyright')).toBeVisible();
  await page.getByTestId('show-case-link').click();
  await expect(page.locator(stageSelector)).toHaveCount(1);
  await expect(page.locator('style[data-retro-layer]')).toHaveCount(32);
  expect(errors).toEqual([]);
});

test('the Show case button is hidden on the normal page (CV-144)', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(SHOW_URLS.normal);
  await expect(page.getByTestId('home-name')).toBeVisible();
  await expect(page.getByTestId('show-case')).toHaveCount(0);
  await expect(page.locator(stageSelector)).toHaveCount(0);
  expect(errors).toEqual([]);
});
