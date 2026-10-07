import { expect, test, type Locator, type Page } from '@playwright/test';
import { collectErrors, NORMAL_SITE, SCREENSHOT_DIR } from './support';

// Web check of the voice mode (docs/voice/SYSTEM_DESIGN.md §12, docs/design/voice/SPEC.md): the
// scripted `FakeVoiceClient` (`?voice=fake`) with a mocked `/api/voice-session`, so no test talks
// to ElevenLabs. The fake script steps every 1.5 s; the page clock runs it step by step.
// Compare the screenshots with docs/design/voice/assets/voice_state_*.png.

const VOICE_SITE = `${NORMAL_SITE}&voice=fake`;
const STEP_MS = 1500;

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

/** Waits for the finite animations (open, fog shift, cards); the orb and fog loop forever. */
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

for (const { name, size } of viewports) {
  test.describe(`voice mode (${name})`, () => {
    test.use({ viewport: size });

    test('a scripted call: connect, lines, a page tool, end, transcript in the chat', async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await page.clock.install();
      await mockSession(page);
      await page.goto(VOICE_SITE);

      const mic = page.getByTestId('chat-voice-mic');
      await expect(mic).toBeVisible();
      await page.screenshot({ path: `${SCREENSHOT_DIR}/voice-launcher-${name}.png` });

      await mic.click();
      const voice = page.getByTestId('chat-voice-mode');
      await expect(voice).toBeVisible();
      await expect(voice).toHaveAttribute('data-phase', 'connecting');
      await settle(voice);
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

      // speaking → the scroll: the fog parts and the chip names the section
      await steps(page, 2);
      await expect(voice).toHaveAttribute('data-phase', 'tool');
      await expect(voice.getByTestId('chat-voice-action')).toHaveText(
        'Scrolled to Selected impact',
      );
      await page.clock.runFor(1000);
      await settle(voice);
      await scrollSettled(page);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/voice-tool-${name}.png` });

      // answer, listening (the fog closes after 3 s), correction, goodbye, the agent hangs up
      await steps(page, 7);
      await page.clock.runFor(3000);
      await expect(voice).toBeHidden();
      const chat = page.getByTestId('chat-panel');
      await expect(chat).toBeVisible();
      const list = chat.getByTestId('chat-list');
      const dividers = list.getByTestId('chat-voice-divider');
      await expect(dividers.first()).toHaveText('Voice call');
      await expect(dividers.last()).toHaveText(/^Call ended · 0:\d\d$/);
      await expect(list.getByTestId('chat-visitor-message')).toHaveText([
        /Show me his selected impact\./,
        /Thanks, bye!/,
      ]);
      await expect(list.getByTestId('chat-assistant-message')).toHaveText([
        /voice assistant/,
        /Here is his selected impact\.$/,
        /Goodbye!/,
      ]);
      await expect(list.getByTestId('chat-action-chip')).toHaveText('Scrolled to Selected impact');
      await settle(chat);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/voice-ended-${name}.png` });
      expect(errors).toEqual([]);
    });

    test('the monthly cap shows its card and keeps the mic', async ({ page }) => {
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
      await page.getByTestId('chat-voice-mic').click();
      const voice = page.getByTestId('chat-voice-mode');
      const card = voice.getByTestId('chat-voice-error');
      await expect(card).toHaveAttribute('data-error', 'quotaExhausted');
      await expect(card).toContainText('Voice is resting this month');
      await settle(voice);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/voice-error-monthly-${name}.png` });

      await voice.getByTestId('chat-voice-close').click();
      await expect(voice).toBeHidden();
      await expect(page.getByTestId('chat-voice-mic')).toBeFocused();
      // The browser logs the failed request itself; only app errors count here.
      expect(errors.filter((error) => !error.includes('503'))).toEqual([]);
    });
  });
}

test('without the flag there is no mic button', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(NORMAL_SITE);
  await expect(page.getByTestId('chat-fab')).toBeVisible();
  await expect(page.getByTestId('chat-voice-mic')).toHaveCount(0);
  expect(errors).toEqual([]);
});
