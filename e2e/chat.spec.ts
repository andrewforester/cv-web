import { expect, test, type Page } from '@playwright/test';

// Web check of the chat widget with a mocked `/api/chat` (docs/chat/SYSTEM_DESIGN.md, testing).
const SCREENSHOT_DIR = 'web-check';

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}

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

const cases = [
  {
    locale: 'en',
    browserLocale: 'en-US',
    question: 'Which apps has he worked on?',
    deltas: ['Andrew built **Cync** and ', '**August Home**:\n\n- 1M+ users each'],
    answer: 'Andrew built Cync and August Home:',
  },
  {
    locale: 'uk',
    browserLocale: 'uk-UA',
    question: 'Над якими застосунками він працював?',
    deltas: ['Андрій працював над **Cync** і ', '**August Home**.'],
    answer: 'Андрій працював над Cync і August Home.',
  },
] as const;

for (const { locale, browserLocale, question, deltas, answer } of cases) {
  test.describe(`chat (${locale})`, () => {
    test.use({ locale: browserLocale });

    test('asks a suggested question and renders the streamed answer', async ({ page }) => {
      const errors = collectErrors(page);
      const requests: unknown[] = [];
      await page.route('**/api/chat', async (route) => {
        requests.push(route.request().postDataJSON());
        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'X-Chat-Api-Version': '1',
          },
          body: sseBody([...deltas]),
        });
      });
      await page.goto('./');

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
          v: 2,
          locale,
          messages: [
            {
              role: 'user',
              content: question,
              page: {
                route: '/',
                locale,
                viewport: 'desktop',
                chat: 'card',
                activeSection: null,
                highlighted: null,
                tools: [],
              },
            },
          ],
        },
      ]);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/chat-${locale}.png` });
      expect(errors).toEqual([]);
    });
  });
}

test('shows the rate-limit notice for a platform 429', async ({ page }) => {
  const errors = collectErrors(page);
  await page.route('**/api/chat', (route) =>
    route.fulfill({ status: 429, headers: { 'Retry-After': '30' }, body: 'Too Many Requests' }),
  );
  await page.goto('./');
  await page.getByTestId('chat-fab').click();
  await page.getByTestId('chat-input').fill('Has he led a team?');
  await page.getByTestId('chat-input').press('Enter');

  await expect(page.getByTestId('chat-notice')).toContainText('a lot of questions');
  await expect(page.getByTestId('chat-retry')).toBeVisible();
  // The browser logs the failed request itself; only app errors count here.
  expect(errors.filter((error) => !error.includes('429'))).toEqual([]);
});
