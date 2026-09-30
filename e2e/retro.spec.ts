import { expect, test } from '@playwright/test';
import {
  consoleLines,
  differences,
  leftovers,
  rootTokens,
  runShowToEnd,
  snapshotPage,
  stageSelector,
  tokenLines,
} from './retroShow';
import { collectErrors, NORMAL_SITE, SCREENSHOT_DIR, SHOW_SITE } from './support';

// The Retro Rebuild show end to end (docs/retro/ARCHITECTURE.md §1 → guards 3 and 4), on
// Playwright's fake clock. Automation (`navigator.webdriver`) runs the show fully scripted: no
// `/api/chat` calls, so nothing here needs a model.
test.use({ locale: 'en-US' });

/** After the first step's end, before the second starts: its console lines are still on screen. */
const FIRST_STEP_DONE = '✓ tokens-colors removed';
/** Time for the AI chat's first-visit hint and similar timers, the same on both pages. */
const AFTER_MS = 3_000;

test('guard 4: every token value the console prints is the value the page gets', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.clock.install();
  await page.goto(SHOW_SITE);
  await expect(page.getByTestId('cv-name')).toBeVisible();
  let checked = false;

  await runShowToEnd(page, async () => {
    if (checked) return;
    const lines = await consoleLines(page);
    if (!lines.includes(FIRST_STEP_DONE)) return;
    checked = true;
    const added = tokenLines(lines, '+');
    const removed = tokenLines(lines, '-');
    expect(added.length).toBeGreaterThan(0);
    const live = await rootTokens(page, [...new Set(removed.map(([name]) => name))]);
    for (const [name, value] of added) expect(live[name], name).toBe(value);
    for (const [name, broken] of removed) expect(live[name], name).not.toBe(broken);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/retro-mid.png` });
  });

  expect(checked).toBe(true);
  expect(errors).toEqual([]);
});

test('guard 3: the show ends on the normal page, AI chat included', async ({ page }) => {
  const errors = collectErrors(page);
  await page.clock.install();
  await page.goto(SHOW_SITE);
  await expect(page.locator(stageSelector)).toHaveCount(1);
  await expect(page.getByTestId('chat-fab')).toHaveCount(0);

  await runShowToEnd(page);
  await page.clock.runFor(AFTER_MS);

  expect(await leftovers(page)).toEqual([]);
  await expect(page.getByTestId('chat-fab')).toBeVisible();
  await expect(page.getByTestId('app-header')).toBeVisible();
  const show = await snapshotPage(page);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/retro-end.png` });

  const normalPage = await page.context().newPage();
  const normalErrors = collectErrors(normalPage);
  await normalPage.clock.install();
  await normalPage.goto(NORMAL_SITE);
  await expect(normalPage.getByTestId('chat-fab')).toBeVisible();
  await normalPage.clock.runFor(AFTER_MS);
  const normal = await snapshotPage(normalPage);

  expect(Object.keys(show.styles).length).toBeGreaterThan(100);
  expect(differences(show, normal)).toEqual([]);
  expect([...errors, ...normalErrors]).toEqual([]);
});

test('with reduced motion the show still runs and ends clean', async ({ page }) => {
  const errors = collectErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto(SHOW_SITE);
  await expect(page.locator(stageSelector)).toHaveCount(1);

  await runShowToEnd(page);

  expect(await leftovers(page)).toEqual([]);
  await expect(page.getByTestId('chat-fab')).toBeVisible();
  expect(errors).toEqual([]);
});

test.describe('who gets the show', () => {
  test('an English desktop visitor, once per browser session', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator(stageSelector)).toHaveCount(1);

    await page.evaluate(() => sessionStorage.setItem('retro.done', '1'));
    await page.reload();
    await expect(page.getByTestId('cv-name')).toBeVisible();
    await expect(page.locator(stageSelector)).toHaveCount(0);
    await expect(page.getByTestId('chat-fab')).toBeVisible();
  });

  test.describe('Ukrainian browser', () => {
    test.use({ locale: 'uk-UA' });

    test('gets the normal site', async ({ page }) => {
      await page.goto('./');
      await expect(page.getByTestId('chat-fab')).toBeVisible();
      await expect(page.locator(stageSelector)).toHaveCount(0);
    });
  });
});
