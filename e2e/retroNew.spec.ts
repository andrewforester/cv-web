import { expect, test } from '@playwright/test';
import {
  expectEndsAsNormalSite,
  expectShownIsApplied,
  MIN_SHOW_MS,
  SHOW_LIMIT_MS,
  stageSelector,
} from './retroShow';
import { collectErrors, PROFILE_SHOW_URLS, SCREENSHOT_DIR } from './support';

// The Show case on `/new` end to end (docs/retro/ARCHITECTURE.md §10 → Guards 1–4 per page): the
// profile opens as its 2001 version and the show fixes it, on `/new`'s own hooks, until it is the
// real `/new`. Same guards as `/`'s (`retro.spec.ts`), same helpers; the show runs fully scripted
// (automation gets no LLM), so nothing here needs a model.
test.use({ locale: 'en-US' });

test.describe('with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('at t = 0 the profile is the broken 2001 page, alone', async ({ page }) => {
    const errors = collectErrors(page);
    await page.clock.install();
    await page.goto(PROFILE_SHOW_URLS.show);
    await expect(page.locator(stageSelector)).toHaveCount(1);
    await expect(page.getByTestId('profile')).toBeVisible();
    // Every `/new` layer (17 shared + 15 own) and the three decorations; no dock, no chat yet.
    await expect(page.locator('style[data-retro-layer]')).toHaveCount(32);
    await expect(page.locator('#top-bar, #page-footer, #oh-snap')).toHaveCount(3);
    await expect(page.locator('#top-bar')).toContainText('Impact');
    await expect(page.locator('#page-footer')).toContainText('AI Builders Webring');
    await expect(page.getByTestId('forest-meta-bar')).toBeHidden();
    await expect(page.getByTestId('retro-dock')).toHaveCount(0);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/retro-new-start.png` });
    expect(errors).toEqual([]);
  });

  test('guard 4: after every chunk, what the console printed is what the page has', async ({
    page,
  }) => {
    await expectShownIsApplied(page, PROFILE_SHOW_URLS, 'retro-new-mid.png');
  });

  test('guard 3: the show ends on the normal /new, AI chat included', async ({ page }) => {
    await expectEndsAsNormalSite(page, PROFILE_SHOW_URLS, 'retro-new-end.png');
  });
});

test('with motion on the show ends on the normal /new within its time budget', async ({ page }) => {
  const showMs = await expectEndsAsNormalSite(page, PROFILE_SHOW_URLS);

  // Timing smoke: 36 chunks with their beats take ≈ 91 s; far less means chunks got skipped.
  expect(showMs).toBeLessThanOrEqual(SHOW_LIMIT_MS);
  expect(showMs).toBeGreaterThan(MIN_SHOW_MS);
});

test('the Show case button on /new starts the show over the profile', async ({ page }) => {
  const errors = collectErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto('./new');
  await expect(page.locator(stageSelector)).toHaveCount(0);
  await page.getByTestId('forest-meta-bar').getByTestId('forest-show-case').click();

  await expect(page.locator(stageSelector)).toHaveCount(1);
  await expect(page.locator('style[data-retro-layer="panel-colors"]')).toBeAttached();
  await page.clock.runFor(3_500);
  await expect(page.getByTestId('retro-console')).toBeVisible();
  await expect(page.getByTestId('retro-console-errors')).toHaveText('36');
  expect(errors).toEqual([]);
});
