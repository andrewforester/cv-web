import { expect, test, type Page } from '@playwright/test';

// Web check of the page agent with a mocked `/api/chat` scripting a v2 tool round
// (docs/chat/AGENT.md §7, API.md → v2).
const SCREENSHOT_DIR = 'web-check';

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}

const usage = {
  inputTokens: 1,
  outputTokens: 1,
  cacheReadInputTokens: 0,
  cacheCreationInputTokens: 0,
};

function sse(events: [string, unknown][]): string {
  return events.map(([name, data]) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`).join('');
}

interface ScriptedRound {
  before: string;
  call: { id: string; name: string; input: Record<string, string> };
  after: string;
}

/** Answers the question with one tool call, and the follow-up (tool results) with `after`. */
async function scriptToolRound(page: Page, round: ScriptedRound): Promise<unknown[]> {
  const requests: unknown[] = [];
  await page.route('**/api/chat', async (route) => {
    const body = route.request().postDataJSON() as { messages: { toolResults?: unknown }[] };
    requests.push(body);
    const followUp = body.messages.some((message) => message.toolResults);
    const events: [string, unknown][] = followUp
      ? [
          ['delta', { text: round.after }],
          ['done', { stopReason: 'end_turn', usage }],
        ]
      : [
          ['delta', { text: round.before }],
          ['tool_call', round.call],
          ['done', { stopReason: 'tool_use', usage }],
        ];
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'X-Chat-Api-Version': '2' },
      body: sse(events),
    });
  });
  return requests;
}

async function ask(page: Page, text: string) {
  await page.getByTestId('chat-fab').click();
  await page.getByTestId('chat-input').fill(text);
  await page.getByTestId('chat-input').press('Enter');
}

const cases = [
  {
    locale: 'en',
    browserLocale: 'en-US',
    question: 'show the apps',
    before: 'Scrolling to his apps.',
    after: 'Here they are.',
  },
  {
    locale: 'uk',
    browserLocale: 'uk-UA',
    question: 'покажи застосунки',
    before: 'Прокручую до застосунків.',
    after: 'Ось вони.',
  },
] as const;

for (const { locale, browserLocale, question, before, after } of cases) {
  test.describe(`page agent (${locale})`, () => {
    test.use({ locale: browserLocale });

    test('scrolls to the apps section and shows the action chip', async ({ page }) => {
      const errors = collectErrors(page);
      const requests = await scriptToolRound(page, {
        before,
        call: { id: 'toolu_e2e_1', name: 'scrollToSection', input: { section: 'apps' } },
        after,
      });
      await page.goto('./');
      const apps = page.locator('[data-agent-id="section:apps"]');
      await expect(apps).not.toBeInViewport();

      await ask(page, question);

      await expect(apps).toBeInViewport();
      await expect(page.getByTestId('chat-action-chip').first()).toBeVisible();
      await expect(page.getByTestId('chat-assistant-message').last()).toContainText(after);
      expect(requests).toHaveLength(2);
      expect(JSON.stringify(requests[1])).toContain('"callId":"toolu_e2e_1"');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/agent-${locale}.png` });
      expect(errors).toEqual([]);
    });
  });
}

test('highlights a CV item with the highlight marker', async ({ page }) => {
  const errors = collectErrors(page);
  await scriptToolRound(page, {
    before: 'Here.',
    call: { id: 'toolu_e2e_h', name: 'highlightElement', input: { target: 'section:apps' } },
    after: 'Done.',
  });
  await page.goto('./');
  await ask(page, 'highlight the apps');

  await expect(page.locator('[data-agent-id="section:apps"]')).toBeInViewport();
  await expect(page.getByTestId('chat-action-chip').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test.describe('openContact confirmation', () => {
  const script: ScriptedRound = {
    before: 'I can open Telegram.',
    call: { id: 'toolu_e2e_c', name: 'openContact', input: { channel: 'telegram' } },
    after: 'Okay, I did not open it.',
  };

  test('asks first, and Cancel opens nothing', async ({ page }) => {
    const errors = collectErrors(page);
    await scriptToolRound(page, script);
    await page.addInitScript(() => {
      (window as unknown as { __opened: string[] }).__opened = [];
      window.open = (url) => {
        (window as unknown as { __opened: string[] }).__opened.push(String(url));
        return null;
      };
    });
    await page.goto('./');
    await ask(page, 'write to him on telegram');

    const card = page.getByTestId('chat-confirmation');
    await expect(card).toBeVisible();
    await page.getByTestId('chat-decline').click();

    await expect(card).toBeHidden();
    await expect(page.getByTestId('chat-assistant-message').last()).toContainText(script.after);
    const opened = await page.evaluate(
      () => (window as unknown as { __opened: string[] }).__opened,
    );
    expect(opened).toEqual([]);
    expect(page.url()).toBe(new URL('./', page.url()).href);
    expect(errors).toEqual([]);
  });
});
