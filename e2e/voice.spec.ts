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

// `wide` gets the slide (≥ 1584 px: the page moves left beside the floating panel), `desktop` a
// 1280 px laptop the overlay (the same panel over the unmoved page), `mobile` the sheets (§4.3).
const viewports = [
  { name: 'wide', size: { width: 1600, height: 900 } },
  { name: 'desktop', size: { width: 1280, height: 800 } },
  { name: 'mobile', size: { width: 390, height: 844 } },
] as const;

/** Half the dock (`--chat-dock-width` 416): how far the slide moves the CV card left. */
const SLIDE_PX = 208;

/** The white CV card's box (`HomePage`), transforms included. */
async function cardBox(page: Page) {
  const box = await page.locator('[data-testid="home"] > div').boundingBox();
  if (!box) throw new Error('no CV card');
  return { x: Math.round(box.x), width: Math.round(box.width) };
}

type CardBox = Awaited<ReturnType<typeof cardBox>>;

/**
 * The floating panel above the phone (ADR-0012), on both sides of 1584 px: 400 × 600 at
 * right/bottom 16, never full height.
 */
async function expectPanel(page: Page, frame: Locator) {
  await settle(frame);
  const viewport = page.viewportSize();
  const box = await frame.boundingBox();
  if (!viewport || !box) throw new Error('no panel');
  const height = Math.min(600, viewport.height - 32);
  expect({
    x: Math.round(box.x),
    y: Math.round(box.y),
    width: Math.round(box.width),
    height: Math.round(box.height),
  }).toEqual({
    x: viewport.width - 16 - 400,
    y: viewport.height - 16 - height,
    width: 400,
    height,
  });
  return box;
}

/**
 * The slide, once settled: dock `side`, the card at its own width with its left edge half the
 * dock further left, the panel at least 24 px right of the card.
 */
async function expectSlide(page: Page, card: CardBox, frame: Locator) {
  await expect(page.locator('html')).toHaveAttribute('data-chat-dock', 'side');
  await expect.poll(() => cardBox(page)).toEqual({ x: card.x - SLIDE_PX, width: card.width });
  const box = await expectPanel(page, frame);
  expect(box.x).toBeGreaterThanOrEqual(card.x - SLIDE_PX + card.width + 24);
}

/** The overlay: dock `none`, the same panel over the unmoved page. */
async function expectOverlay(page: Page, card: CardBox, frame: Locator) {
  await expect(page.locator('html')).toHaveAttribute('data-chat-dock', 'none');
  await expectPanel(page, frame);
  expect(await cardBox(page)).toEqual(card);
}

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
      const card = await cardBox(page);

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
      if (name === 'wide') await expectSlide(page, card, chat);
      if (name === 'desktop') await expectOverlay(page, card, chat);
      await settle(chat);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/voice-text-${name}.png` });

      await chat.getByTestId('chat-voice-call').click();
      const voice = page.getByTestId('chat-voice-panel');
      await expect(voice).toBeVisible();
      await expect(voice).toHaveAttribute('data-phase', 'connecting');
      await settle(voice);
      if (name === 'wide') await expectSlide(page, card, voice);
      else if (name === 'desktop') await expectOverlay(page, card, voice);
      else {
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

      if (name !== 'mobile') {
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
      if (name !== 'mobile') {
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

      // minimized: the pill in the launcher's place, the page back in the centre
      const pill = page.getByTestId('chat-voice-pill');
      await expect(pill).toBeVisible();
      await expect(html).toHaveAttribute('data-chat-dock', 'none');
      await expect.poll(() => cardBox(page)).toEqual(card);
      await settle(pill);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/voice-minimized-${name}.png` });

      // unfold and end: the chat shows the transcript between the call dividers
      await pill.getByTestId('chat-voice-pill-expand').click();
      // Wider screens folded the chat view (it unfolds to it), the phone the call sheet.
      const end =
        name === 'mobile'
          ? voice.getByTestId('chat-voice-end')
          : chat.getByTestId('chat-voice-end');
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

  test('the page makes room for the panel at once, with no transition', async ({ page }) => {
    const errors = collectErrors(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(VOICE_SITE);
    const card = await cardBox(page);
    const main = page.locator('main');
    expect(await main.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe(
      '0s',
    );
    await page.getByTestId('chat-fab').click();
    await expect(page.locator('html')).toHaveAttribute('data-chat-dock', 'side');
    // No transition: the card is in its place on the first read, not after an animation.
    expect(await cardBox(page)).toEqual({ x: card.x - SLIDE_PX, width: card.width });
    // The panel only fades (no scale, no slide): its box is in place while it fades in.
    const { width, height } = viewports[0].size;
    const box = await page.getByTestId('chat-panel').boundingBox();
    expect(box && [Math.round(box.x + box.width), Math.round(box.y + box.height)]).toEqual([
      width - 16,
      height - 16,
    ]);
    expect(errors).toEqual([]);
  });
});
