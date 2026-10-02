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
                tools: ['highlightElement', 'openContact', 'scrollToSection', 'switchLanguage'],
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
  await page.goto(NORMAL_SITE);
  await page.getByTestId('chat-fab').click();
  await page.getByTestId('chat-input').fill('Has he led a team?');
  await page.getByTestId('chat-input').press('Enter');

  await expect(page.getByTestId('chat-notice')).toContainText('a lot of questions');
  await expect(page.getByTestId('chat-retry')).toBeVisible();
  // The browser logs the failed request itself; only app errors count here.
  expect(errors.filter((error) => !error.includes('429'))).toEqual([]);
});

// Forest look (docs/design/forest-chat): the chat opened by the `#ask` link, empty and answered,
// on the desktop card and the phone sheet. Compare the screenshots with the package's PNGs.
const viewports = [
  { name: 'desktop', size: { width: 1280, height: 800 } },
  { name: 'phone', size: { width: 390, height: 844 } },
] as const;

for (const { locale, browserLocale, question, deltas, answer } of cases) {
  for (const { name, size } of viewports) {
    test.describe(`chat look (${locale}, ${name})`, () => {
      test.use({ locale: browserLocale, viewport: size });

      test('opens from #ask and shows the empty state and an answer', async ({ page }) => {
        const errors = collectErrors(page);
        await page.route('**/api/chat', (route) =>
          route.fulfill({
            status: 200,
            headers: {
              'Content-Type': 'text/event-stream; charset=utf-8',
              'X-Chat-Api-Version': '1',
            },
            body: sseBody([...deltas]),
          }),
        );
        await page.goto('./#ask');

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await expect(page).toHaveURL(/\/$/);
        // Let the open animation finish so the screenshot shows the final look.
        await dialog.evaluate((panel) =>
          Promise.all(panel.getAnimations().map((animation) => animation.finished)),
        );
        await page.screenshot({ path: `${SCREENSHOT_DIR}/chat-empty-${locale}-${name}.png` });

        await dialog.getByRole('button', { name: question }).click();
        await expect(dialog.getByTestId('chat-assistant-message')).toContainText(answer);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/chat-answer-${locale}-${name}.png` });
        expect(errors).toEqual([]);
      });
    });
  }
}
