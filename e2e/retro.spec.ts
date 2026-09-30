import { expect, test } from '@playwright/test';
import {
  consoleLines,
  differences,
  expectStepApplied,
  leftovers,
  runShowToEnd,
  settledStep,
  snapshotPage,
  stageSelector,
} from './retroShow';
import { collectErrors, NORMAL_SITE, SCREENSHOT_DIR, SHOW_SITE } from './support';

// The Retro Rebuild show end to end (docs/retro/ARCHITECTURE.md §1 → guards 3 and 4), on
// Playwright's fake clock. Automation (`navigator.webdriver`) runs the show fully scripted: no
// `/api/chat` calls, so nothing here needs a model.
test.use({ locale: 'en-US' });

/** The mid-show screenshot is taken when this step has settled (SPEC: after the cards step). */
const MID_SHOW_STEP = 4;
/** Time for the AI chat's first-visit hint and similar timers, the same on both pages. */
const AFTER_MS = 3_000;

test('guard 4: after every step, what the console printed is what the page has', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.clock.install();
  await page.goto(SHOW_SITE);
  await expect(page.getByTestId('cv-name')).toBeVisible();
  const checked: string[] = [];

  await runShowToEnd(page, async () => {
    const step = settledStep(await consoleLines(page));
    if (!step || checked.includes(step.name)) return;
    checked.push(step.name);
    await expectStepApplied(page, step.lines);
    if (step.name.startsWith(`${MID_SHOW_STEP}/`))
      await page.screenshot({ path: `${SCREENSHOT_DIR}/retro-mid.png` });
  });

  const numbers = checked.map((name) => name.split(' ')[0]);
  expect(numbers).toEqual(checked.map((_, index) => `${index + 1}/${checked.length}`));
  expect(checked.length).toBeGreaterThan(MID_SHOW_STEP);
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
