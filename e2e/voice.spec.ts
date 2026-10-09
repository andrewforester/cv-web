import { expect, test, type Locator, type Page } from '@playwright/test';
import { collectErrors, NORMAL_SITE, SCREENSHOT_DIR } from './support';

// Web check of the voice call (docs/voice/SYSTEM_DESIGN.md §12, docs/design/voice/SPEC.md): the
// scripted `FakeVoiceClient` (`?voice=fake`) with a mocked `/api/voice-session`, so no test talks
// to ElevenLabs. The fake script steps every 1.5 s; the page clock runs it step by step.
// Compare the screenshots with docs/design/voice/assets/voice_state_*.png.

const VOICE_SITE = `${NORMAL_SITE}&voice=fake`;
const STEP_MS = 1500;
const CLOCK_START = new Date('2026-10-07T10:00:00Z');

test.use({ locale: 'en-US' });

function mockSession(page: Page, status = 200, body: unknown = sessionBody) {
  return page.route('**/api/voice-session', (route) =>
    route.fulfill({
      status,
      headers: { 'Content-Type': 'application/json', 'X-Voice-Api-Version': '1' },
      body: JSON.stringify(body),
    }),
  );
}
const sessionBody = { v: 1, conversationToken: 'fake', maxCallSeconds: 180 };

/** Waits for the finite animations (open, view swaps, cards); the orb loops forever. */
async function settle(target: Locator) {
  await target.evaluate((element) =>
    Promise.all(
      element
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}

/** Waits until the page's smooth scroll stops (a screenshot mid-scroll misplaces fixed layers). */
async function scrollSettled(page: Page) {
  let previous = -1;
  for (;;) {
    const y = await page.evaluate(() => window.scrollY);
    if (y === previous) return;
    previous = y;
    await page.waitForTimeout(250);
  }
}

async function steps(page: Page, count: number) {
  for (let i = 0; i < count; i += 1) await page.clock.runFor(STEP_MS);
}

const viewports = [
  { name: 'desktop', size: { width: 1280, height: 800 } },
  { name: 'mobile', size: { width: 390, height: 844 } },
] as const;

/** The CV page's content width: the shell pads the chat's column away while it shows (`side`). */
const mainWidth = (page: Page) =>
  page.locator('main').evaluate((main) => {
    const style = getComputedStyle(main);
    return main.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  });

/** A `/api/chat` mock that answers once and keeps the requests. */
async function mockChat(page: Page): Promise<unknown[]> {
  const requests: unknown[] = [];
  const usage = {
    inputTokens: 1,
    outputTokens: 1,
    cacheReadInputTokens: 0,
    cacheCreationInputTokens: 0,
  };
  await page.route('**/api/chat', async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'X-Chat-Api-Version': '4' },
      body: [
        `event: delta\ndata: ${JSON.stringify({ text: 'From the call, yes.' })}\n\n`,
        `event: done\ndata: ${JSON.stringify({ stopReason: 'end_turn', usage })}\n\n`,
      ].join(''),
    });
  });
  return requests;
}

for (const { name, size } of viewports) {
  test.describe(`voice call (${name})`, () => {
    test.use({ viewport: size });

    test('a scripted call: the panel, a page tool, typing, the chat during the call, the pill, the transcript', async ({
      page,
    }) => {
      const errors = collectErrors(page);
      // Paused: the script moves only when the test runs the clock (a running clock races on CI).
      await page.clock.install({ time: CLOCK_START });
      await page.clock.pauseAt(new Date(CLOCK_START.getTime() + 1000));
      await mockSession(page);
      const chatRequests = await mockChat(page);
      await page.goto(VOICE_SITE);
      const html = page.locator('html');
      const fullWidth = await mainWidth(page);

      // One launcher: the pill opens the chat; a call starts from its composer.
      const fab = page.getByTestId('chat-fab');
      await expect(fab).toHaveText('Talk to my AI');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/voice-launcher-${name}.png` });

      await fab.click();
      const chat = page.getByTestId('chat-panel');
      const list = chat.getByTestId('chat-list');
      await expect(chat).toBeVisible();
      await expect(chat.getByTestId('chat-input')).toHaveAttribute(
        'placeholder',
        '…or type instead',
      );
      if (name === 'desktop') {
        // The page shifts left: the column (400 + its 16 px gutter) is reserved beside it.
        await expect(html).toHaveAttribute('data-chat-dock', 'side');
        // The width animates with the column (ADR-0010 → Decision 2): wait for it to settle.
        await expect.poll(() => mainWidth(page)).toBeLessThanOrEqual(fullWidth - 400);
      }
      await settle(chat);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/voice-text-${name}.png` });

      await chat.getByTestId('chat-voice-call').click();
      const voice = page.getByTestId('chat-voice-panel');
      await expect(voice).toBeVisible();
      await expect(voice).toHaveAttribute('data-phase', 'connecting');
      await settle(voice);
      if (name === 'desktop') {
        await expect(html).toHaveAttribute('data-chat-dock', 'side');
        expect(await mainWidth(page)).toBeLessThanOrEqual(fullWidth - 400);
      } else {
        // A bottom sheet over the live page; the page pads its end by the sheet's height.
        await expect(html).toHaveAttribute('data-chat-dock', 'bottom');
        const box = await voice.boundingBox();
        expect(box && Math.round(box.y + box.height)).toBe(size.height);
      }
      await page.screenshot({ path: `${SCREENSHOT_DIR}/voice-connecting-${name}.png` });

      // live → speaking → greeting
      await steps(page, 3);
      await expect(voice).toHaveAttribute('data-phase', 'speaking');
      await expect(voice.getByTestId('chat-voice-caption')).toContainText('voice assistant');
      await expect(voice.getByTestId('chat-voice-timer')).toBeVisible();
      await page.screenshot({ path: `${SCREENSHOT_DIR}/voice-speaking-${name}.png` });

      // listening → the visitor's line
      await steps(page, 2);
      await expect(voice).toHaveAttribute('data-phase', 'listening');
      await expect(voice.getByTestId('chat-voice-caption')).toHaveText(
        'Show me his selected impact.',
      );
      await page.screenshot({ path: `${SCREENSHOT_DIR}/voice-listening-${name}.png` });

      if (name === 'desktop') {
        await voice.getByTestId('chat-voice-mute').click();
        await expect(voice).toHaveAttribute('data-muted', 'true');
        await expect(voice.getByTestId('chat-voice-status')).toHaveText('Mic off');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/voice-muted-${name}.png` });
        await voice.getByTestId('chat-voice-mute').click();
        await expect(voice).toHaveAttribute('data-muted', 'false');
      }

      // speaking → the scroll: the page is visible beside the panel, the chip names the section
      await steps(page, 2);
      await expect(voice).toHaveAttribute('data-phase', 'tool');
      await expect(voice.getByTestId('chat-voice-action')).toHaveText(
        'Scrolled to Selected impact',
      );
      await page.clock.runFor(1000);
      await settle(voice);
      await scrollSettled(page);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/voice-tool-${name}.png` });

      // the answer; then a line typed mid-call goes to the agent, never to /api/chat
      await steps(page, 1);
      const typed = 'Does he know Kotlin?';
      if (name === 'desktop') {
        // In the call view: the sent line is the caption, the next one a draft in the field.
        const field = voice.getByTestId('chat-input');
        await field.fill(typed);
        await field.press('Enter');
        await expect(voice.getByTestId('chat-voice-caption')).toHaveText(typed);
        await field.fill('And Swift?');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/voice-typed-${name}.png` });
        await voice.getByTestId('chat-voice-chat-toggle').click();
        // One draft for both views.
        await expect(chat.getByTestId('chat-input')).toHaveValue('And Swift?');
        await chat.getByTestId('chat-input').fill('');
      } else {
        await voice.getByTestId('chat-voice-chat-toggle').click();
        await chat.getByTestId('chat-input').fill(typed);
        await chat.getByTestId('chat-input').press('Enter');
      }
      // Show chat: every line so far, spoken and typed, and the call composer; the toggle flips
      await expect(chat).toBeVisible();
      await expect(chat.getByTestId('chat-voice-chat-toggle')).toHaveText('Hide chat');
      await expect(list.getByTestId('chat-visitor-message')).toHaveText([
        /Show me his selected impact\./,
        /Does he know Kotlin\?/,
      ]);
      await expect(chat.getByTestId('chat-input')).toHaveAttribute(
        'placeholder',
        'Type a message…',
      );
      // listening, then the agent's spoken answer to the typed line
      await steps(page, 3);
      await expect(list.getByTestId('chat-assistant-message').last()).toContainText(
        'You typed: “Does he know Kotlin?”',
      );
      expect(chatRequests).toHaveLength(0);
      await settle(chat);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/voice-chat-${name}.png` });

      if (name === 'mobile') {
        // The system Back steps out of the chat to the call sheet, not off the site.
        await page.goBack();
        await expect(voice).toBeVisible();
        await voice.getByTestId('chat-voice-minimize').click();
      } else {
        await chat.getByTestId('chat-voice-minimize').click();
      }

      // minimized: the pill in the launcher's place, the page back to full width
      const pill = page.getByTestId('chat-voice-pill');
      await expect(pill).toBeVisible();
      await expect(html).toHaveAttribute('data-chat-dock', 'none');
      await expect.poll(() => mainWidth(page)).toBe(fullWidth);
      await settle(pill);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/voice-minimized-${name}.png` });

      // unfold and end: the chat shows the transcript between the call dividers
      await pill.getByTestId('chat-voice-pill-expand').click();
      // Desktop folded the chat view (it unfolds to it), the phone the call sheet.
      const end =
        name === 'desktop'
          ? chat.getByTestId('chat-voice-end')
          : voice.getByTestId('chat-voice-end');
      await end.click();
      await expect(chat).toBeVisible();
      const dividers = list.getByTestId('chat-voice-divider');
      await expect(dividers.first()).toHaveText('Voice call');
      await expect(dividers.last()).toHaveText(/^Call ended · 0:\d\d$/);
      await expect(list.getByTestId('chat-assistant-message')).toHaveText([
        /voice assistant/,
        /Here is his selected impact/,
        /You typed/,
      ]);
      await expect(list.getByTestId('chat-action-chip')).toHaveText('Scrolled to Selected impact');
      // Call is back in End's place.
      await expect(chat.getByTestId('chat-voice-call')).toBeVisible();
      await settle(chat);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/voice-ended-${name}.png` });

      // One conversation: the next typed question carries the call's lines.
      await chat.getByTestId('chat-input').fill('Did he show it?');
      await chat.getByTestId('chat-input').press('Enter');
      await expect(list.getByTestId('chat-assistant-message').last()).toContainText(
        'From the call, yes.',
      );
      const [request] = chatRequests as { messages: { voiceCalls?: { lines: unknown[] }[] }[] }[];
      const lines = request?.messages.at(-1)?.voiceCalls?.[0]?.lines;
      expect(lines).toHaveLength(5);
      expect(lines).toContainEqual({ role: 'visitor', text: typed });
      expect(errors).toEqual([]);
    });

    test('the monthly cap shows its card; closing it gives the focus back to Call', async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await mockSession(page, 503, {
        error: {
          code: 'quota_exhausted',
          message: 'Monthly voice minutes used up',
          retryable: false,
          retryAfterSeconds: 86_400,
        },
      });
      await page.goto(VOICE_SITE);
      await page.getByTestId('chat-fab').click();
      await page.getByTestId('chat-voice-call').click();
      const voice = page.getByTestId('chat-voice-panel');
      const card = voice.getByTestId('chat-voice-error');
      await expect(card).toHaveAttribute('data-error', 'quotaExhausted');
      await expect(card).toContainText('Voice is resting this month');
      await settle(voice);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/voice-error-monthly-${name}.png` });

      await voice.getByTestId('chat-voice-close').click();
      await expect(voice).toBeHidden();
      await expect(page.getByTestId('chat-voice-call')).toBeFocused();
      // The browser logs the failed request itself; only app errors count here.
      expect(errors.filter((error) => !error.includes('503'))).toEqual([]);
    });
  });
}

test('without the flag there is no Call, and the launcher still says Talk to my AI', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto(NORMAL_SITE);
  await expect(page.getByTestId('chat-fab')).toHaveText('Talk to my AI');
  await page.getByTestId('chat-fab').click();
  const chat = page.getByTestId('chat-panel');
  await expect(chat.getByTestId('chat-input')).toHaveAttribute('placeholder', 'Ask a question…');
  await expect(page.getByTestId('chat-voice-call')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test.describe('reduced motion', () => {
  test.use({ viewport: viewports[0].size });

  test('the page makes room for the column at once, with no width transition', async ({ page }) => {
    const errors = collectErrors(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(VOICE_SITE);
    const fullWidth = await mainWidth(page);
    const main = page.locator('main');
    expect(await main.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe(
      '0s',
    );
    await page.getByTestId('chat-fab').click();
    await expect(page.locator('html')).toHaveAttribute('data-chat-dock', 'side');
    // No transition: the reserved width is there on the first read, not after an animation.
    expect(await mainWidth(page)).toBeLessThanOrEqual(fullWidth - 400);
    // The column only fades (no slide): its box is in place while it fades in.
    const box = await page.getByTestId('chat-panel').boundingBox();
    expect(box && Math.round(box.x + box.width)).toBe(viewports[0].size.width - 16);
    expect(errors).toEqual([]);
  });
});
