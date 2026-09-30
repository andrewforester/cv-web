import { expect, type Page } from '@playwright/test';

// Helpers for `retro.spec.ts`: drive the Retro Rebuild show on Playwright's fake clock, read what
// the console printed and what the show left on the page (docs/retro/ARCHITECTURE.md §1 → guards
// 3 and 4).

/** Fake time per turn of the loop; the runner is time-based, so the slice only sets the pace. */
const SLICE_MS = 250;
/** The 8-step, 36-chunk show takes ≈ 73 s of show time with reduced motion, ≈ 90 s with motion. */
export const SHOW_LIMIT_MS = 110_000;

export const stageSelector = '[data-retro-stage]';
const leftoverSelector =
  '[data-retro-stage], style[data-retro-layer], style[data-retro-host], style[data-retro-motion], #top-bar, #page-footer, #oh-snap, [data-testid="retro-decoration"], [data-testid="retro-dock"]';

/** The console's text, one entry per line (`+`/`-` gutters included). */
export function consoleLines(page: Page): Promise<string[]> {
  return page
    .getByTestId('retro-console-screen')
    .locator(':scope > div')
    .allTextContents()
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
    if (!waitedForChat && (await consoleLines(page)).some((line) => line.includes("import('"))) {
      waitedForChat = true;
      await expect(page.getByTestId('chat-fab')).toBeVisible();
    }
    if ((await page.locator(stageSelector).count()) === 0) return elapsed + SLICE_MS;
  }
  throw new Error(`The show did not end within ${SHOW_LIMIT_MS} ms of show time`);
}

/** Everything the show owns that must be gone at the end, as selectors that still match. */
export function leftovers(page: Page): Promise<string[]> {
  return page.evaluate(
    (selector) => Array.from(document.querySelectorAll(selector), (element) => element.outerHTML),
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

/** Custom property declarations (`--name: value;`) in the console lines with the given gutter. */
export function tokenLines(lines: string[], gutter: '+' | '-'): [name: string, value: string][] {
  const pattern = new RegExp(`^\\${gutter}\\s*(--[\\w-]+):\\s*(.*);$`);
  return lines.flatMap((line) => {
    const match = pattern.exec(line.trim());
    return match?.[1] && match[2] !== undefined ? [[match[1], match[2].trim()]] : [];
  });
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

/** A step the console shows as finished: `// n/N title`, its code, then `✓ n/N title` last. */
export interface SettledStep {
  /** `n/N title`. */
  name: string;
  /** The lines between the step's title and its `✓` line. */
  lines: string[];
}

/** The step settling on screen now, or `null` while one is typing (or the show isn't in steps). */
export function settledStep(lines: string[]): SettledStep | null {
  const name = lines.at(-1)?.replace(/^✓ /, '');
  if (!name || name === lines.at(-1) || !/^\d+\/\d+ /.test(name)) return null;
  const start = lines.lastIndexOf(`// ${name}`);
  return start < 0 ? null : { name, lines: lines.slice(start + 1, -1) };
}

/** The layer files a step printed (`--- layers/<id>.css`), each with the lines under it. */
function layerSections(lines: string[]): { id: string; lines: string[] }[] {
  const sections: { id: string; lines: string[] }[] = [];
  for (const line of lines) {
    const file = /^--- layers\/(.+)\.css$/.exec(line);
    if (file?.[1]) sections.push({ id: file[1], lines: [] });
    else sections.at(-1)?.lines.push(line);
  }
  return sections;
}

/**
 * Guard 4 for one finished step: every effect the console printed for it is what the page has now.
 * A layer file → its `<style>` is gone, and for a token file every `+` value is the live value;
 * `getElementById('<id>').remove()` → the element is gone; an `import(…)` → the chat button is on.
 */
export async function expectStepApplied(page: Page, lines: string[]): Promise<void> {
  expect(lines.filter((line) => line.startsWith('// skipped'))).toEqual([]);
  const sections = layerSections(lines);
  for (const section of sections) {
    await expect(page.locator(`style[data-retro-layer="${section.id}"]`)).toHaveCount(0);
    const added = tokenLines(section.lines, '+');
    if (added.length === 0) continue;
    const removed = tokenLines(section.lines, '-');
    const live = await rootTokens(page, [...new Set(removed.map(([name]) => name))]);
    for (const [name, value] of added) expect(live[name], name).toBe(value);
    for (const [name, broken] of removed) expect(live[name], name).not.toBe(broken);
  }
  const decorations = lines.flatMap((line) => {
    const match = /getElementById\('([^']+)'\)\.remove\(\)/.exec(line);
    return match?.[1] ? [match[1]] : [];
  });
  for (const id of decorations) await expect(page.locator(`[id="${id}"]`)).toHaveCount(0);
  const loadsModule = lines.some((line) => line.includes('await import('));
  if (loadsModule) await expect(page.getByTestId('chat-fab')).toBeVisible();
  expect(sections.length + decorations.length + Number(loadsModule)).toBeGreaterThan(0);
}
