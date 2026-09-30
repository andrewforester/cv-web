import { expect, type Page, test } from '@playwright/test';
import {
  consoleLines,
  differences,
  expectStepApplied,
  leftovers,
  type PageSnapshot,
  runShowToEnd,
  settledStep,
  SHOW_LIMIT_MS,
  snapshotPage,
  stageSelector,
} from './retroShow';
import { collectErrors, NORMAL_SITE, SCREENSHOT_DIR, SHOW_SITE } from './support';

// The Retro Rebuild show end to end (docs/retro/ARCHITECTURE.md §1 → guards 3 and 4; §9 → Guards
// after the split), on Playwright's fake clock. The fake clock drives the runner but not CSS
// transitions or view transitions, so guards 3 and 4 run with reduced motion (the show's no-motion
// path) and one extra run with motion on checks the same end state. Automation
// (`navigator.webdriver`) runs the show fully scripted: no `/api/chat` calls, so nothing here needs
// a model.
test.use({ locale: 'en-US' });

/** The mid-show screenshot is taken when this step has settled (SPEC: after the cards step). */
const MID_SHOW_STEP = 4;
/** Time for the AI chat's first-visit hint and similar timers, the same on both pages. */
const AFTER_MS = 3_000;
/** Below this the show has skipped chunks: 36 chunks with a 1 s beat each take ≈ 90 s. */
const MIN_SHOW_MS = 60_000;

/** The show on a fake clock, from the first paint to the end. Returns its show time in ms. */
async function runShow(page: Page): Promise<number> {
  await page.clock.install();
  await page.goto(SHOW_SITE);
  await expect(page.locator(stageSelector)).toHaveCount(1);
  await expect(page.getByTestId('chat-fab')).toHaveCount(0);
  const showMs = await runShowToEnd(page);
  await page.clock.runFor(AFTER_MS);
  return showMs;
}

/** Today's site in a second page: the reference the ended show is compared with. */
async function normalSiteSnapshot(
  page: Page,
): Promise<{ snapshot: PageSnapshot; errors: string[] }> {
  const normalPage = await page.context().newPage();
  const errors = collectErrors(normalPage);
  await normalPage.clock.install();
  await normalPage.goto(NORMAL_SITE);
  await expect(normalPage.getByTestId('chat-fab')).toBeVisible();
  await normalPage.clock.runFor(AFTER_MS);
  return { snapshot: await snapshotPage(normalPage), errors };
}

/**
 * Guard 3: runs the show and checks that it left nothing (styles, stage, decorations, windows,
 * motion styles and classes) and that every computed style equals `?retro=0`. View transitions and
 * CSS transitions run in real time, so the comparison retries until they have settled.
 */
async function expectEndsAsNormalSite(page: Page, screenshot?: string): Promise<number> {
  const errors = collectErrors(page);
  const { snapshot: normal, errors: normalErrors } = await normalSiteSnapshot(page);
  const showMs = await runShow(page);

  await expect.poll(() => leftovers(page)).toEqual([]);
  await expect(page.getByTestId('chat-fab')).toBeVisible();
  await expect(page.getByTestId('app-header')).toBeVisible();
  await expect.poll(async () => differences(await snapshotPage(page), normal)).toEqual([]);
  if (screenshot) await page.screenshot({ path: `${SCREENSHOT_DIR}/${screenshot}` });

  expect(Object.keys((await snapshotPage(page)).styles).length).toBeGreaterThan(100);
  expect([...errors, ...normalErrors]).toEqual([]);
  return showMs;
}

test.describe('with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

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
    await expectEndsAsNormalSite(page, 'retro-end.png');
  });
});

test('with motion on the show ends on the normal page within its time budget', async ({ page }) => {
  const showMs = await expectEndsAsNormalSite(page);

  // Timing smoke: 36 chunks with their beats take ≈ 90 s; far less means chunks got skipped.
  expect(showMs).toBeLessThanOrEqual(SHOW_LIMIT_MS);
  expect(showMs).toBeGreaterThan(MIN_SHOW_MS);
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
