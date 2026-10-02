import { expect, type Page, test } from '@playwright/test';
import {
  expectEndsAsNormalSite,
  expectShownIsApplied,
  MIN_SHOW_MS,
  SHOW_LIMIT_MS,
  stageSelector,
} from './retroShow';
import { collectErrors, CV_SHOW_URLS, SCREENSHOT_DIR, SHOW_SITE } from './support';

// The Retro Rebuild show end to end (docs/retro/ARCHITECTURE.md §1 → guards 3 and 4; §9 → Guards
// after the split), on Playwright's fake clock. The fake clock drives the runner but not CSS
// transitions or view transitions, so guards 3 and 4 run with reduced motion (the show's no-motion
// path) and one extra run with motion on checks the same end state. Automation
// (`navigator.webdriver`) runs the show fully scripted: no `/api/chat` calls, so nothing here needs
// a model.
test.use({ locale: 'en-US' });

test.describe('with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('guard 4: after every chunk, what the console printed is what the page has', async ({
    page,
  }) => {
    await expectShownIsApplied(page, CV_SHOW_URLS, 'retro-mid.png');
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
    await expectEndsAsNormalSite(page, CV_SHOW_URLS, 'retro-end.png');
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
  const showMs = await expectEndsAsNormalSite(page, CV_SHOW_URLS);

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

test('the Show case button on / starts the show over the CV', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.getByTestId('forest-show-case').click();
  await expect(page.locator(stageSelector)).toHaveCount(1);
  await expect(page.locator('style[data-retro-layer]').first()).toBeAttached();
});
