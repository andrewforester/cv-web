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
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: question }).click();

  const reply = dialog.getByTestId('chat-assistant-message');
  await expect(reply).toContainText(answer);
  await expect(reply.locator('strong').first()).toHaveText('Cync');
  await expect(dialog.getByTestId('chat-send')).toBeVisible();
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
// on the desktop card and the phone sheet. Compare the screenshots with the package's PNGs.
const viewports = [
  { name: 'desktop', size: { width: 1280, height: 800 } },
  { name: 'phone', size: { width: 390, height: 844 } },
] as const;

for (const { name, size } of viewports) {
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

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(page).toHaveURL(/\/(#chat)?$/);
      // Let the open animation finish so the screenshot shows the final look.
      await dialog.evaluate((panel) =>
        Promise.all(panel.getAnimations().map((animation) => animation.finished)),
      );
      await page.screenshot({ path: `${SCREENSHOT_DIR}/chat-empty-${name}.png` });

      await dialog.getByRole('button', { name: question }).click();
      await expect(dialog.getByTestId('chat-assistant-message')).toContainText(answer);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/chat-answer-${name}.png` });
      expect(errors).toEqual([]);
    });
  });
}

// One page (ADR-0006): the first questions of ADR-0006 → Decision 3.
test('offers the page’s first questions', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(`${NORMAL_SITE}#ask`);
  await expect(page.getByRole('dialog').getByTestId('chat-suggestion')).toHaveText([
    'How does he build with AI agents?',
    'What impact has he had?',
    'Which apps has he shipped?',
    'Is he open to new roles?',
  ]);
  expect(errors).toEqual([]);
});

test.describe('chat on a phone: system Back', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('closes the full-screen chat and stays on the page', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(NORMAL_SITE);
    await page.getByTestId('chat-fab').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page).toHaveURL(/#chat$/);

    await page.goBack();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page).toHaveURL(/\/\?retro=0$/);
    expect(errors).toEqual([]);
  });
});
