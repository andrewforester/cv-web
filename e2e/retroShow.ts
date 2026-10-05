import { expect, type Page } from '@playwright/test';
import { collectErrors, SCREENSHOT_DIR, type ShowUrls } from './support';

// Helpers for the show specs (none while the show is off; `retro.spec.ts` comes back with `retro-4`,
// ARCHITECTURE §11): drive the page's Retro Rebuild show on Playwright's fake clock, read what the
// console printed and what the show left on the page (docs/retro/ARCHITECTURE.md §1 → guards 3
// and 4; the page's URLs come as `ShowUrls`).

/** Fake time per turn of the loop; the runner is time-based, so the slice only sets the pace. */
const SLICE_MS = 250;
/** The 8-step, 36-chunk show takes ≈ 78 s of show time with reduced motion, ≈ 91 s with motion. */
export const SHOW_LIMIT_MS = 110_000;
/** Below this the show has skipped chunks: 36 chunks with a 1 s beat each take ≈ 90 s. */
export const MIN_SHOW_MS = 60_000;

export const stageSelector = '[data-retro-stage]';
const leftoverSelector = [
  '[data-retro-stage]',
  'style[data-retro-layer]',
  'style[data-retro-host]',
  'style[data-retro-motion]',
  '#top-bar',
  '#page-footer',
  '#oh-snap',
  '[data-testid="retro-decoration"]',
  '[data-testid="retro-dock"]',
].join(', ');

/** One row of the DevTools console: its kind (`data-kind`) and its text. */
export interface ConsoleRowText {
  kind: string;
  text: string;
}

/** The console's rows, top to bottom (input rows keep their line breaks). */
export function consoleRows(page: Page): Promise<ConsoleRowText[]> {
  return page
    .getByTestId('retro-console-screen')
    .locator(':scope > div')
    .evaluateAll((rows) =>
      rows.map((row) => ({
        kind: row.getAttribute('data-kind') ?? '',
        text: row.textContent ?? '',
      })),
    )
    .catch(() => []);
}

/**
 * Runs the show on the installed fake clock until it has ended (no stage left), calling `onTick`
 * after every slice of fake time, and returns the show time it took in ms. The AI chat chunk loads
 * over the real network, so when the console has typed its import the loop waits (in real time)
 * for the chat button before moving the clock on.
 */
export async function runShowToEnd(page: Page, onTick?: () => Promise<void>): Promise<number> {
  let waitedForChat = false;
  for (let elapsed = 0; elapsed < SHOW_LIMIT_MS; elapsed += SLICE_MS) {
    await page.clock.runFor(SLICE_MS);
    await onTick?.();
    const rows = await consoleRows(page);
    if (!waitedForChat && rows.some(({ text }) => text.includes("import('"))) {
      waitedForChat = true;
      await expect(page.getByTestId('chat-fab')).toBeVisible();
    }
    if ((await page.locator(stageSelector).count()) === 0) return elapsed + SLICE_MS;
  }
  throw new Error(`The show did not end within ${SHOW_LIMIT_MS} ms of show time`);
}

/**
 * Everything the show owns that must be gone at the end: elements that still match, and custom
 * properties the token chunks set inline on `<html>`.
 */
export function leftovers(page: Page): Promise<string[]> {
  return page.evaluate(
    (selector) => [
      ...Array.from(document.querySelectorAll(selector), (element) => element.outerHTML),
      ...Array.from(document.documentElement.style)
        .filter((name) => name.startsWith('--'))
        .map((name) => `html { ${name} }`),
    ],
    leftoverSelector,
  );
}

/** Computed properties compared between the ended show and the normal page (guard 3). */
const PROPERTIES = [
  'display',
  'position',
  'top',
  'left',
  'float',
  'clear',
  'width',
  'height',
  'max-width',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border-top-width',
  'border-top-style',
  'border-top-color',
  'border-left-width',
  'border-left-style',
  'border-left-color',
  'box-shadow',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'letter-spacing',
  'color',
  'background-color',
  'background-image',
  'text-align',
  'text-decoration-line',
  'grid-template-columns',
  'column-gap',
  'row-gap',
  'transform',
  'visibility',
  'opacity',
  'z-index',
];

export interface PageSnapshot {
  title: string;
  /** The motion classes live on `html` (morph) and `body` (fade) while a chunk applies. */
  htmlClass: string;
  bodyClass: string;
  /** `path → property: value` for `html`, `body` and every element under `#root`. */
  styles: Record<string, string>;
}

/** Waits for finite CSS animations and transitions, then reads the computed styles. */
export async function snapshotPage(page: Page): Promise<PageSnapshot> {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (animation) =>
          animation.playState !== 'running' ||
          animation.effect?.getComputedTiming().iterations === Infinity,
      ),
  );
  return page.evaluate((properties) => {
    const root = document.getElementById('root');
    const elements = [
      document.documentElement,
      document.body,
      ...(root ? Array.from(root.querySelectorAll('*')) : []),
    ];
    const styles: Record<string, string> = {};
    elements.forEach((element, index) => {
      const testId = element.getAttribute('data-testid');
      const path = `${index} ${element.tagName.toLowerCase()}${testId ? `[${testId}]` : ''}`;
      const computed = getComputedStyle(element);
      for (const property of properties) {
        styles[`${path} → ${property}`] = computed.getPropertyValue(property);
      }
    });
    return {
      title: document.title,
      htmlClass: document.documentElement.className,
      bodyClass: document.body.className,
      styles,
    };
  }, PROPERTIES);
}

/** The entries of `actual` that differ from `expected`, as readable lines. */
export function differences(actual: PageSnapshot, expected: PageSnapshot): string[] {
  const keys = new Set([...Object.keys(actual.styles), ...Object.keys(expected.styles)]);
  const lines = [...keys]
    .filter((key) => actual.styles[key] !== expected.styles[key])
    .map((key) => `${key}: ${actual.styles[key]} ≠ ${expected.styles[key]}`);
  if (actual.title !== expected.title) lines.unshift(`title: ${actual.title} ≠ ${expected.title}`);
  if (actual.htmlClass !== expected.htmlClass)
    lines.unshift(`html class: ${actual.htmlClass} ≠ ${expected.htmlClass}`);
  if (actual.bodyClass !== expected.bodyClass)
    lines.unshift(`body class: ${actual.bodyClass} ≠ ${expected.bodyClass}`);
  return lines;
}

/** The live value of each custom property on `:root`. */
export function rootTokens(page: Page, names: string[]): Promise<Record<string, string>> {
  return page.evaluate(
    (list) =>
      Object.fromEntries(
        list.map((name) => [
          name,
          getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
        ]),
      ),
    names,
  );
}

/** A console input that has run: its echo and the row it resolved with. */
export interface RanChunk {
  input: string;
  outcome: ConsoleRowText;
}

/** The chunks that have run, in order: each echo with its `✓` row (after `<· undefined`) or warn. */
export function ranChunks(rows: ConsoleRowText[]): RanChunk[] {
  return rows.flatMap((row, index) => {
    if (row.kind !== 'echo') return [];
    const next = rows[index + 1];
    const outcome = next?.kind === 'result' ? rows[index + 2] : next;
    return outcome && (outcome.kind === 'done' || outcome.kind === 'warn')
      ? [{ input: row.text, outcome }]
      : [];
  });
}

/** The open step group's title (`n/N title`), or `null` between steps. */
export function openGroup(rows: ConsoleRowText[]): string | null {
  return rows.find((row) => row.kind === 'group' && !row.text.startsWith('✓'))?.text ?? null;
}

/** `'value'` or `"value"` (when it has a `'`), as the console prints string literals. */
function unquote(literal: string): string {
  return literal.startsWith('"') ? (JSON.parse(literal) as string) : literal.slice(1, -1);
}

/**
 * Guard 4 for one chunk that has run: what the console printed is what the page has now.
 * `querySelector('style[data-retro-layer="<id>"]').remove()` → that `<style>` is gone;
 * `style.setProperty(name, value)` → the computed token is the printed value (and the token
 * layer named in the `✓` line is gone); `getElementById('<id>').remove()` → the element is gone;
 * `await import(…)` → the chat button is on.
 */
export async function expectChunkApplied(page: Page, { input, outcome }: RanChunk): Promise<void> {
  expect(outcome.kind, `${input} → ${outcome.text}`).toBe('done');
  const removed = /data-retro-layer="([^"]+)"/.exec(input)?.[1];
  if (removed) await expect(page.locator(`style[data-retro-layer="${removed}"]`)).toHaveCount(0);
  const tokens = [...input.matchAll(/^style\.setProperty\('([^']+)', (.+)\)$/gm)].map(
    ([, name = '', value = '']) => [name, unquote(value)] as const,
  );
  if (input.includes('document.documentElement')) {
    const layer = /^✓ ([\w-]+): \d+ tokens? set$/.exec(outcome.text)?.[1];
    await expect(page.locator(`style[data-retro-layer="${layer}"]`)).toHaveCount(0);
    const live = await rootTokens(
      page,
      tokens.map(([name]) => name),
    );
    for (const [name, value] of tokens) expect(live[name], name).toBe(value);
  }
  const decoration = /getElementById\('([^']+)'\)\.remove\(\)/.exec(input)?.[1];
  if (decoration) await expect(page.locator(`[id="${decoration}"]`)).toHaveCount(0);
  const loadsModule = input.includes('await import(');
  if (loadsModule) await expect(page.getByTestId('chat-fab')).toBeVisible();
  const kinds = [removed, input.includes('document.documentElement'), decoration, loadsModule];
  expect(kinds.filter(Boolean), input).toHaveLength(1);
}

/** Time for the AI chat's first-visit hint and similar timers, the same on both pages. */
const AFTER_MS = 3_000;

/** The page's show on a fake clock, from the first paint to the end. Returns its show ms. */
async function runShow(page: Page, urls: ShowUrls): Promise<number> {
  await page.clock.install();
  await page.goto(urls.show);
  await expect(page.locator(stageSelector)).toHaveCount(1);
  await expect(page.getByTestId('chat-fab')).toHaveCount(0);
  const showMs = await runShowToEnd(page);
  await page.clock.runFor(AFTER_MS);
  return showMs;
}

/** The page as today's site in a second tab: the reference the ended show is compared with. */
async function normalSiteSnapshot(
  page: Page,
  urls: ShowUrls,
): Promise<{ snapshot: PageSnapshot; errors: string[] }> {
  const normalPage = await page.context().newPage();
  const errors = collectErrors(normalPage);
  await normalPage.clock.install();
  await normalPage.goto(urls.normal);
  await expect(normalPage.getByTestId('chat-fab')).toBeVisible();
  await normalPage.clock.runFor(AFTER_MS);
  return { snapshot: await snapshotPage(normalPage), errors };
}

/**
 * Guard 3: runs the page's show and checks that it left nothing (styles, stage, decorations,
 * windows, motion styles and classes) and that every computed style equals the page with
 * `?retro=0`. View transitions and CSS transitions run in real time, so the comparison retries
 * until they have settled. Returns the show time in ms.
 */
export async function expectEndsAsNormalSite(
  page: Page,
  urls: ShowUrls,
  screenshot?: string,
): Promise<number> {
  const errors = collectErrors(page);
  const { snapshot: normal, errors: normalErrors } = await normalSiteSnapshot(page, urls);
  const showMs = await runShow(page, urls);

  await expect.poll(() => leftovers(page)).toEqual([]);
  await expect(page.getByTestId('chat-fab')).toBeVisible();
  await expect.poll(async () => differences(await snapshotPage(page), normal)).toEqual([]);
  if (screenshot) await page.screenshot({ path: `${SCREENSHOT_DIR}/${screenshot}` });

  expect(Object.keys((await snapshotPage(page)).styles).length).toBeGreaterThan(100);
  expect([...errors, ...normalErrors]).toEqual([]);
  return showMs;
}

/**
 * The mid-show screenshot is taken once this step's first chunk has run: its echo carries the
 * step's narration comment (Round 5) above the command.
 */
const MID_SHOW_STEP = 4;

/**
 * Guard 4: runs the page's show with the console open and, after every chunk, checks that what the
 * console printed is what the page has; every step's group opens in order, all 36 chunks run and
 * the counters end at 0. With `midShowScreenshot`, also checks that step 4 opens with its
 * narration as a `//` comment while the chat stays silent, and screenshots that frame.
 */
export async function expectShownIsApplied(
  page: Page,
  urls: ShowUrls,
  midShowScreenshot?: string,
): Promise<void> {
  const errors = collectErrors(page);
  await page.clock.install();
  await page.goto(urls.show);
  await expect(page.getByTestId('home-name')).toBeVisible();
  const checked = new Set<string>();
  const groups: string[] = [];
  let screenshot = false;
  let ended = false;

  await runShowToEnd(page, async () => {
    const rows = await consoleRows(page);
    if (!ended && rows.some(({ kind }) => kind === 'end')) {
      ended = true;
      await expect(page.getByTestId('retro-console-errors')).toHaveText('0');
      await expect(page.getByTestId('retro-console-warnings')).toHaveText('0');
    }
    const group = openGroup(rows);
    if (group && !groups.includes(group)) groups.push(group);
    const ran = ranChunks(rows);
    for (const chunk of ran.filter(({ input }) => !checked.has(input))) {
      checked.add(chunk.input);
      await expectChunkApplied(page, chunk);
    }
    if (midShowScreenshot && !screenshot && group?.startsWith(`${MID_SHOW_STEP}/`) && ran.length) {
      screenshot = true;
      // The step's narration is a comment above its first command; the chat stays silent.
      expect(ran[0]?.input).toMatch(/^\/\/ (?!→)/);
      await expect(page.getByTestId('retro-chat-log')).not.toContainText('Images:');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/${midShowScreenshot}` });
    }
  });

  expect(groups.map((title) => title.split(' ')[0])).toEqual(
    groups.map((_, index) => `${index + 1}/8`),
  );
  expect(groups).toHaveLength(8);
  expect(checked.size).toBe(36);
  expect(screenshot).toBe(midShowScreenshot !== undefined);
  expect(ended).toBe(true);
  expect(errors).toEqual([]);
}
