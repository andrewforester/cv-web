import { expect, type Page, test } from '@playwright/test';
import {
  consoleRows,
  differences,
  expectChunkApplied,
  leftovers,
  openGroup,
  type PageSnapshot,
  ranChunks,
  runShowToEnd,
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

/**
 * The mid-show screenshot is taken once this step's first chunk has run: its echo carries the
 * step's narration comment (Round 5) above the command.
 */
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
  await expect(page.getByTestId('language-switcher')).toBeVisible();
  await expect.poll(async () => differences(await snapshotPage(page), normal)).toEqual([]);
  if (screenshot) await page.screenshot({ path: `${SCREENSHOT_DIR}/${screenshot}` });

  expect(Object.keys((await snapshotPage(page)).styles).length).toBeGreaterThan(100);
  expect([...errors, ...normalErrors]).toEqual([]);
  return showMs;
}

test.describe('with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('guard 4: after every chunk, what the console printed is what the page has', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.clock.install();
    await page.goto(SHOW_SITE);
    await expect(page.getByTestId('forest-name')).toBeVisible();
    const checked = new Set<string>();
    const groups: string[] = [];
    let screenshot = false;
    let ended = false;

    await runShowToEnd(page, async () => {
      const rows = await consoleRows(page);
      if (!ended && rows.some(({ kind }) => kind === 'end')) {
        ended = true;
        await expect(page.getByTestId('retro-console-errors')).toHaveText('0');
        await expect(page.getByTestId('retro-console-warnings')).toHaveText('0');
      }
      const group = openGroup(rows);
      if (group && !groups.includes(group)) groups.push(group);
      const ran = ranChunks(rows);
      for (const chunk of ran.filter(({ input }) => !checked.has(input))) {
        checked.add(chunk.input);
        await expectChunkApplied(page, chunk);
      }
      if (!screenshot && group?.startsWith(`${MID_SHOW_STEP}/`) && ran.length > 0) {
        screenshot = true;
        // The step's narration is a comment above its first command; the chat stays silent.
        expect(ran[0]?.input).toMatch(/^\/\/ (?!→)/);
        await expect(page.getByTestId('retro-chat-log')).not.toContainText('Images:');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/retro-mid.png` });
      }
    });

    // Every step's group opened in order, every chunk ran and was checked, the counters ended at 0.
    expect(groups.map((title) => title.split(' ')[0])).toEqual(
      groups.map((_, index) => `${index + 1}/8`),
    );
    expect(groups).toHaveLength(8);
    expect(checked.size).toBe(36);
    expect(screenshot).toBe(true);
    expect(ended).toBe(true);
    expect(errors).toEqual([]);
  });

  test('the intro: the page alone, our chat with two lines, then DevTools', async ({ page }) => {
    const errors = collectErrors(page);
    await page.clock.install();
    await page.goto(SHOW_SITE);
    await expect(page.getByTestId('forest-name')).toBeVisible();
    await expect(page.getByTestId('retro-dock')).toHaveCount(0);

    await page.clock.runFor(1_000);
    const log = page.getByRole('log', { name: 'Conversation with the agent' });
    await expect(log).toContainText("That's how this CV would look like in 2001.");
    await expect(log).not.toContainText("Now let's fix it.");
    await page.clock.runFor(1_000);
    await expect(log).toContainText("Now let's fix it.");
    await expect(page.getByTestId('retro-console')).toHaveCount(0);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/retro-intro.png` });

    await page.clock.runFor(1_000);
    await expect(page.getByTestId('retro-console')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('the agent chat is the site chat card and the highlight is the Elements selection', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.clock.install();
    await page.goto(SHOW_SITE);
    await page.clock.runFor(4_000);
    const chat = page.getByTestId('retro-chat');
    await expect(chat.getByRole('heading', { name: 'Agent' })).toBeVisible();
    await expect(chat.getByText('Fixing this site live')).toBeVisible();
    await expect(chat).not.toContainText('***');
    // The site's chat tokens, shielded from the damage layers that restyle `:root`.
    await expect(chat).toHaveCSS('font-family', /Onest/);
    await expect(page.locator('body')).toHaveCSS('padding-right', '400px');

    const plate = page.getByTestId('retro-highlight-plate');
    const plates = new Set<string>();
    for (let elapsed = 0; elapsed < 20_000 && plates.size < 2; elapsed += 250) {
      await page.clock.runFor(250);
      if (await plate.count()) {
        plates.add((await plate.textContent()) ?? '');
        if (plates.size === 1) await expectPlateOnFirstHeading(page);
      }
    }
    // Chunk 1 marks every heading, chunk 2 the whole page area.
    expect([...plates]).toEqual([expect.stringMatching(/^p\.name × \d+$/), 'body880 × 800']);
    await expect(page.getByTestId('retro-console')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('guard 3: the show ends on the normal page, AI chat included', async ({ page }) => {
    await expectEndsAsNormalSite(page, 'retro-end.png');
  });
});

/** Chunk 1's plate sits on its first target's (the name's) bottom-left corner (SPEC → Plate). */
async function expectPlateOnFirstHeading(page: Page) {
  const plate = await page.getByTestId('retro-highlight-plate').boundingBox();
  const heading = await page.getByTestId('forest-name').boundingBox();
  if (!plate || !heading) return;
  expect(plate.x).toBeCloseTo(Math.max(heading.x, 0), 0);
  expect(plate.y + plate.height).toBeCloseTo(Math.min(heading.y + heading.height, 800), 0);
}

test('with motion on the show ends on the normal page within its time budget', async ({ page }) => {
  const showMs = await expectEndsAsNormalSite(page);

  // Timing smoke: 36 chunks with their beats take ≈ 90 s; far less means chunks got skipped.
  expect(showMs).toBeLessThanOrEqual(SHOW_LIMIT_MS);
  expect(showMs).toBeGreaterThan(MIN_SHOW_MS);
});

test('the show never starts on its own: without ?retro=1 the visitor gets today’s site', async ({
  page,
}) => {
  await page.goto('./');
  await expect(page.getByTestId('forest-name')).toBeVisible();
  await expect(page.getByTestId('chat-fab')).toBeVisible();
  await expect(page.locator(stageSelector)).toHaveCount(0);
});
