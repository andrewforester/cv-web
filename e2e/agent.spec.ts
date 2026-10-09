import { expect, test, type Page } from '@playwright/test';
import { collectErrors, NORMAL_SITE, screenshotPath } from './support';

// Web check of the page agent on the one page with a mocked `/api/chat` scripting a v4 tool round
// (docs/chat/AGENT.md §7, API.md → v4, ADR-0006 → Decision 3).

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
      headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'X-Chat-Api-Version': '4' },
      body: sse(events),
    });
  });
  return requests;
}

async function ask(page: Page, text: string) {
  await page.getByTestId('chat-fab').click();
  // The page narrows beside the column (ADR-0010 → Decision 2); a real answer comes long after.
  await expect.poll(() => page.locator('main').evaluate((m) => m.getAnimations().length)).toBe(0);
  await page.getByTestId('chat-input').fill(text);
  await page.getByTestId('chat-input').press('Enter');
}

/**
 * On a phone a visual action folds the chat sheet into its pill so the page shows (AGENT.md →
 * Mobile sheet): the screenshot is that page; the pill then opens the conversation again.
 */
async function reopenOnPhone(page: Page, isMobile: boolean, screenshot?: string) {
  if (!isMobile) return;
  if (screenshot) await page.screenshot({ path: screenshotPath(screenshot, true) });
  await page.getByTestId('chat-fab').click();
}

// CV-221: on a phone the sheet's Back (history.go(-1)) restores the scroll to the top, undoing the
// action; Playwright reports these two as expected failures there until it is fixed.
const PHONE_SCROLL_BUG = 'CV-221: the chat sheet closing undoes the scroll on a phone';

const TOOLS = ['highlightElement', 'openContact', 'scrollToSection'];

test('scrolls to the selected impact and names it in the chip @mobile', async ({
  page,
  isMobile,
}) => {
  test.fail(isMobile, PHONE_SCROLL_BUG);
  const errors = collectErrors(page);
  const requests = await scriptToolRound(page, {
    before: 'Scrolling to his impact.',
    call: { id: 'toolu_e2e_1', name: 'scrollToSection', input: { section: 'impact' } },
    after: 'Here it is.',
  });
  await page.goto(NORMAL_SITE);
  const impact = page.locator('[data-agent-id="section:impact"]');
  await expect(impact).not.toBeInViewport({ ratio: 1 });

  await ask(page, 'Show his selected impact');

  await expect.soft(impact).toBeInViewport({ ratio: 0.5 });
  await reopenOnPhone(page, isMobile, 'agent');
  await expect(page.getByTestId('chat-action-chip').first()).toContainText('Selected impact');
  await expect(page.getByTestId('chat-assistant-message').last()).toContainText('Here it is.');
  expect(requests).toHaveLength(2);
  expect(requests[0]).toEqual({
    v: 4,
    messages: [
      {
        role: 'user',
        content: 'Show his selected impact',
        page: {
          // On a phone the chat is the full-screen sheet.
          viewport: isMobile ? 'mobile' : 'desktop',
          chat: isMobile ? 'sheet' : 'card',
          activeSection: 'header',
          highlighted: null,
          tools: TOOLS,
        },
      },
    ],
  });
  expect(JSON.stringify(requests[1])).toContain('"callId":"toolu_e2e_1"');
  if (!isMobile) await page.screenshot({ path: screenshotPath('agent', false) });
  expect(errors).toEqual([]);
});

test('highlights his work at Transcenda with the highlight marker @mobile', async ({
  page,
  isMobile,
}) => {
  test.fail(isMobile, PHONE_SCROLL_BUG);
  const errors = collectErrors(page);
  const requests = await scriptToolRound(page, {
    before: 'Here.',
    call: {
      id: 'toolu_e2e_h',
      name: 'highlightElement',
      input: { target: 'experience:transcenda' },
    },
    after: 'Done.',
  });
  await page.goto(NORMAL_SITE);
  await ask(page, 'Highlight his work at Transcenda');

  const job = page.locator('[data-agent-id="experience:transcenda"]');
  await expect.soft(job).toBeInViewport();
  await expect(job).toHaveAttribute('data-agent-highlighted');
  await reopenOnPhone(page, isMobile);
  await expect(page.getByTestId('chat-action-chip').first()).toContainText('Transcenda');
  await expect(page.getByTestId('chat-assistant-message').last()).toContainText('Done.');

  // The next question's snapshot says what the visitor sees now (the highlight lasts 3 s).
  await page.getByTestId('chat-input').fill('what is this?');
  await page.getByTestId('chat-input').press('Enter');
  await expect.poll(() => requests.length).toBe(3);
  const next = requests[2] as { messages: unknown[] };
  expect(next.messages.at(-1)).toMatchObject({
    page: { activeSection: 'experience', highlighted: 'experience:transcenda' },
  });
  expect(errors).toEqual([]);
});

test.describe('openContact linkedin with the confirmation', () => {
  const script: ScriptedRound = {
    before: 'I can open his LinkedIn.',
    call: { id: 'toolu_e2e_c', name: 'openContact', input: { channel: 'linkedin' } },
    after: 'Okay.',
  };

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __opened: string[] }).__opened = [];
      window.open = (url) => {
        (window as unknown as { __opened: string[] }).__opened.push(String(url));
        return null;
      };
    });
  });

  const opened = (page: Page) =>
    page.evaluate(() => (window as unknown as { __opened: string[] }).__opened);

  test('asks first; Confirm opens his LinkedIn in a new tab @mobile', async ({ page }) => {
    const errors = collectErrors(page);
    const requests = await scriptToolRound(page, script);
    await page.goto(NORMAL_SITE);
    await ask(page, 'open his linkedin');

    const card = page.getByTestId('chat-confirmation');
    await expect(card).toContainText('Open Andrew’s LinkedIn profile?');
    await expect(card).toContainText('linkedin.com/in/andriipanasiuk');
    expect(await opened(page)).toEqual([]);
    await page.getByTestId('chat-confirm').click();

    await expect(card).toBeHidden();
    await expect(page.getByTestId('chat-assistant-message').last()).toContainText(script.after);
    expect(await opened(page)).toEqual(['https://www.linkedin.com/in/andriipanasiuk/']);
    expect(JSON.stringify(requests[1])).toContain('"result":{"ok":true}');
    expect(errors).toEqual([]);
  });

  test('Cancel opens nothing @mobile', async ({ page, isMobile }) => {
    const errors = collectErrors(page);
    await scriptToolRound(page, script);
    await page.goto(NORMAL_SITE);
    await ask(page, 'open his linkedin');

    const card = page.getByTestId('chat-confirmation');
    await expect(card).toBeVisible();
    await page.getByTestId('chat-decline').click();

    await expect(card).toBeHidden();
    await expect(page.getByTestId('chat-assistant-message').last()).toContainText(script.after);
    expect(await opened(page)).toEqual([]);
    // On a phone the open sheet keeps its own history entry (`#chat`).
    const stays = NORMAL_SITE + (isMobile ? '#chat' : '');
    expect(page.url()).toBe(new URL(stays, page.url()).href);
    expect(errors).toEqual([]);
  });
});
