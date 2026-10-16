import { expect, test, type Locator, type Page } from '@playwright/test';
import { collectErrors, NORMAL_SITE, screenshotPath } from './support';

// The page's top toolbar: section navigation, sticky at the top of the viewport. It carries the
// handle (moved out of the meta bar; hidden on phones) and one button per section.
test.use({ locale: 'en-US' });

const HANDLE = '~/andrew.panasiuk/cv';
const LINKS = [
  { text: 'skills', section: 'skills' },
  { text: 'impact', section: 'impact' },
  { text: 'projects', section: 'projects' },
  { text: 'experience', section: 'experience' },
  { text: 'craft', section: 'craft' },
  { text: 'process', section: 'loop' },
  { text: 'education', section: 'education' },
  { text: 'about', section: 'about' },
  { text: 'contact', section: 'contacts' },
];

function toolbar(page: Page): Locator {
  return page.getByTestId('home-toolbar');
}

function link(page: Page, text: string): Locator {
  return toolbar(page).getByTestId('home-toolbar-link').filter({ hasText: text });
}

function section(page: Page, id: string): Locator {
  return page.locator(`[data-agent-id="section:${id}"]`);
}

async function top(locator: Locator): Promise<number> {
  return (await locator.boundingBox())?.y ?? Number.NaN;
}

async function bottom(locator: Locator): Promise<number> {
  const box = await locator.boundingBox();
  return box ? box.y + box.height : Number.NaN;
}

test('the toolbar lists the sections and scrolls to one under itself', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(NORMAL_SITE);

  const bar = toolbar(page);
  await expect(bar).toBeVisible();
  await expect(bar).toHaveAttribute('aria-label', 'Sections');
  await expect(bar.getByText(HANDLE)).toBeVisible();
  const links = bar.getByTestId('home-toolbar-link');
  await expect(links).toHaveText(LINKS.map((entry) => entry.text));
  for (const [index, entry] of LINKS.entries()) {
    await expect(links.nth(index)).toHaveAttribute('data-section', entry.section);
  }
  // On the header no section is being read yet.
  await expect(bar.locator('[aria-current="true"]')).toHaveCount(0);

  await link(page, 'experience').click();

  const experience = section(page, 'experience');
  // The section's top lands just below the sticky toolbar (never under it), which stays at the
  // top. The scroll may be smooth, so wait until the section has arrived.
  const gap = async () => (await top(experience)) - (await bottom(bar));
  await expect.poll(gap).toBeLessThanOrEqual(120);
  await expect(link(page, 'experience')).toHaveAttribute('aria-current', 'true');
  expect(await gap()).toBeGreaterThanOrEqual(0);
  expect(await top(bar)).toBe(0);
  await expect(bar.locator('[aria-current="true"]')).toHaveCount(1);

  await page.screenshot({ path: screenshotPath('toolbar', false) });
  expect(errors).toEqual([]);
});

test('on a phone the toolbar drops the handle and still reaches the last section @mobile', async ({
  page,
  isMobile,
}) => {
  const errors = collectErrors(page);
  await page.goto(NORMAL_SITE);

  const bar = toolbar(page);
  await expect(bar).toBeVisible();
  await expect(bar.getByTestId('home-toolbar-link')).toHaveCount(LINKS.length);
  if (isMobile) await expect(bar.getByText(HANDLE)).toBeHidden();

  // The links may scroll sideways inside the toolbar on a narrow screen.
  const contact = link(page, 'contact');
  await contact.scrollIntoViewIfNeeded();
  await contact.click();

  await expect(section(page, 'contacts')).toBeInViewport();
  await expect(contact).toHaveAttribute('aria-current', 'true');
  expect(await top(bar)).toBe(0);
  if (isMobile) {
    // The toolbar never makes the phone scroll sideways.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  }

  await page.screenshot({ path: screenshotPath('toolbar', isMobile) });
  expect(errors).toEqual([]);
});

test('the meta bar no longer carries the handle', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(NORMAL_SITE);

  await expect(page.getByTestId('home-meta-bar')).toBeVisible();
  await expect(page.getByTestId('home-meta-bar')).not.toContainText(HANDLE);
  expect(errors).toEqual([]);
});

test('with the chat docked at the side the toolbar still spans the viewport', async ({ page }) => {
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(NORMAL_SITE);
  await page.getByTestId('chat-fab').click();
  await expect(page.locator('html')).toHaveAttribute('data-chat-dock', 'side');

  // The page (and the bar) slid left by half the dock...
  await expect.poll(async () => (await toolbar(page).boundingBox())?.x ?? 0).toBeLessThan(-100);
  // ...and the bar's background still reaches the viewport's right edge.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const hit = document.elementFromPoint(window.innerWidth - 2, 4);
        return Boolean(hit?.closest('[data-testid="home-toolbar"]'));
      }),
    )
    .toBe(true);
  expect(errors).toEqual([]);
});

test('on desktop the header rises to the meta bar: the photo is level with the location', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto(NORMAL_SITE);
  const photo = await page.getByTestId('home-photo').boundingBox();
  const name = await page.getByTestId('home-name').boundingBox();
  const location = await page.getByTestId('home-meta-bar').getByText('Wrocław').boundingBox();
  if (!photo || !name || !location) throw new Error('page top not laid out');

  expect(Math.abs(photo.y - location.y)).toBeLessThanOrEqual(4);
  expect(name.x + name.width).toBeLessThan(location.x);
  expect(errors).toEqual([]);
});

test('on a phone the meta bar stays above the header @mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'the phone layout only');
  await page.goto(NORMAL_SITE);
  const photo = await page.getByTestId('home-photo').boundingBox();
  const meta = await page.getByTestId('home-meta-bar').boundingBox();
  if (!photo || !meta) throw new Error('page top not laid out');

  expect(photo.y).toBeGreaterThan(meta.y + meta.height);
});
