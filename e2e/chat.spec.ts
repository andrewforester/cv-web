import { expect, test } from '@playwright/test';
import { collectErrors, NORMAL_SITE, SCREENSHOT_DIR } from './support';

// Web check of the chat widget with a mocked `/api/chat` (docs/chat/SYSTEM_DESIGN.md, testing).

function sseBody(deltas: string[]): string {
  const events = deltas.map((text) => `event: delta\ndata: ${JSON.stringify({ text })}\n\n`);
  const usage = {
    inputTokens: 1,
    outputTokens: 1,
    cacheReadInputTokens: 0,
    cacheCreationInputTokens: 0,
  };
  return [
    ': ping\n\n',
    ...events,
    `event: done\ndata: ${JSON.stringify({ stopReason: 'end_turn', usage })}\n\n`,
  ].join('');
}

test.use({ locale: 'en-US' });

const question = 'Which apps has he shipped?';
const deltas = ['Andrew built **Cync** and ', '**August Home**:\n\n- 1M+ users each'];
const answer = 'Andrew built Cync and August Home:';

test('asks a suggested question and renders the streamed answer', async ({ page }) => {
  const errors = collectErrors(page);
  const requests: unknown[] = [];
  await page.route('**/api/chat', async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'X-Chat-Api-Version': '4',
      },
      body: sseBody(deltas),
    });
  });
  await page.goto(NORMAL_SITE);

  await page.getByTestId('chat-fab').click();
  const chat = page.getByTestId('chat-panel');
  await expect(chat).toBeVisible();
  await chat.getByRole('button', { name: question }).click();

  const reply = chat.getByTestId('chat-assistant-message');
  await expect(reply).toContainText(answer);
  await expect(reply.locator('strong').first()).toHaveText('Cync');
  await expect(chat.getByTestId('chat-send')).toBeVisible();
  expect(requests).toEqual([
    {
      v: 4,
      messages: [
        {
          role: 'user',
          content: question,
          page: {
            viewport: 'desktop',
            chat: 'card',
            activeSection: 'header',
            highlighted: null,
            tools: ['highlightElement', 'openContact', 'scrollToSection'],
          },
        },
      ],
    },
  ]);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/chat.png` });

  // The one collapse control (ADR-0013) folds the panel back into the launcher.
  const collapse = chat.getByTestId('chat-collapse');
  await expect(collapse).toHaveAccessibleName('Collapse chat');
  await collapse.click();
  await expect(chat).toBeHidden();
  await expect(page.getByTestId('chat-fab')).toBeFocused();
  expect(errors).toEqual([]);
});

test('shows the rate-limit notice for a platform 429', async ({ page }) => {
  const errors = collectErrors(page);
  await page.route('**/api/chat', (route) =>
    route.fulfill({ status: 429, headers: { 'Retry-After': '30' }, body: 'Too Many Requests' }),
  );
  await page.goto(NORMAL_SITE);
  await page.getByTestId('chat-fab').click();
  await page.getByTestId('chat-input').fill('Is he open to new roles?');
  await page.getByTestId('chat-input').press('Enter');

  await expect(page.getByTestId('chat-notice')).toContainText('a lot of questions');
  await expect(page.getByTestId('chat-retry')).toBeVisible();
  // The browser logs the failed request itself; only app errors count here.
  expect(errors.filter((error) => !error.includes('429'))).toEqual([]);
});

// The chat look on the v3 palette (docs/design/v3): opened by the `#ask` link, empty and answered,
// in the floating panel on a wide screen (≥ 1584 px: the page slides left beside it) and on a
// laptop (over the unmoved page; docs/design/voice/SPEC.md → Layout zones), and in the phone's
// bottom sheet. Compare the screenshots with the package's PNGs.
const viewports = [
  { name: 'wide', size: { width: 1600, height: 900 }, dock: 'side' },
  { name: 'desktop', size: { width: 1280, height: 800 }, dock: 'none' },
  { name: 'phone', size: { width: 390, height: 844 }, dock: 'bottom' },
] as const;

for (const { name, size, dock } of viewports) {
  test.describe(`chat look (${name})`, () => {
    test.use({ viewport: size });

    test('opens from #ask and shows the empty state and an answer', async ({ page }) => {
      const errors = collectErrors(page);
      await page.route('**/api/chat', (route) =>
        route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'X-Chat-Api-Version': '4',
          },
          body: sseBody(deltas),
        }),
      );
      await page.goto('./#ask');

      const chat = page.getByTestId('chat-panel');
      await expect(chat).toBeVisible();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator('html')).toHaveAttribute('data-chat-dock', dock);
      // Let the open animation finish so the screenshot shows the final look.
      await chat.evaluate((panel) =>
        Promise.all(panel.getAnimations().map((animation) => animation.finished)),
      );
      if (name !== 'phone') {
        // The morph has landed: no clip left, the panel 400 × 600 at right/bottom 16.
        await expect(chat).toHaveCSS('clip-path', 'none');
        const box = await chat.boundingBox();
        if (!box) throw new Error('no panel');
        expect({
          width: box.width,
          height: box.height,
          right: size.width - box.x - box.width,
          bottom: size.height - box.y - box.height,
        }).toEqual({ width: 400, height: 600, right: 16, bottom: 16 });
      }
      await page.screenshot({ path: `${SCREENSHOT_DIR}/chat-empty-${name}.png` });

      await chat.getByRole('button', { name: question }).click();
      await expect(chat.getByTestId('chat-assistant-message')).toContainText(answer);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/chat-answer-${name}.png` });
      expect(errors).toEqual([]);
    });
  });
}

// One page (ADR-0006): the first questions of ADR-0006 → Decision 3.
test('offers the page’s first questions', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(`${NORMAL_SITE}#ask`);
  await expect(page.getByTestId('chat-panel').getByTestId('chat-suggestion')).toHaveText([
    'How does he build with AI agents?',
    'What impact has he had?',
    'Which apps has he shipped?',
    'Is he open to new roles?',
  ]);
  expect(errors).toEqual([]);
});

test.describe('chat on a phone: the bottom sheet', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('opens over the page without a history entry, so Back stays the page’s', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto(NORMAL_SITE);
    const length = await page.evaluate(() => history.length);
    await page.getByTestId('chat-fab').click();
    const chat = page.getByTestId('chat-panel');
    await expect(chat).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-chat-dock', 'bottom');
    await chat.evaluate((panel) =>
      Promise.all(panel.getAnimations().map((animation) => animation.finished)),
    );
    // The call's sheet (docs/design/voice/SPEC.md → Layout 5): full width, 472 px, at the bottom.
    const box = await chat.boundingBox();
    expect(box && [box.x, box.y, box.width, box.height].map(Math.round)).toEqual([
      0, 844 - 472, 390, 472,
    ]);
    // The page above it still scrolls.
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await expect(chat).toBeVisible();
    expect(await page.evaluate(() => history.length)).toBe(length);
    await expect(page).toHaveURL(/\/\?retro=0$/);
    expect(errors).toEqual([]);
  });
});
