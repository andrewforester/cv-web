import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { stageSelector } from './retroShow';
import { collectErrors, SHOW_URLS } from './support';

// Show case layers must hit the page (docs/retro/ARCHITECTURE.md §1 → guard 2, in a real
// browser): on the first frame of the show, every selector of every damage layer matches at least
// one element. A layer that styles nothing (say, every book removed from the CV, so
// `broken-covers.css` matches nothing) fails here with the layer and the selector named.
const LAYERS_DIR = 'src/screens/retro/layers';

/** Splits at commas outside parentheses. */
function splitTopLevel(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of list) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else current += char;
  }
  return [...parts, current];
}

/** Selectors of a layer's rules (also inside `@media`), pseudo-elements removed: they can't be queried. */
function selectorsOf(css: string): string[] {
  const preludes = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{};]+)\{/g)].map(
    ([, prelude = '']) => prelude.trim(),
  );
  return preludes
    .filter((prelude) => !prelude.startsWith('@'))
    .flatMap(splitTopLevel)
    .map((selector) => selector.replace(/::[\w-]+(\([^)]*\))?/g, '').trim());
}

const layers = readdirSync(LAYERS_DIR)
  .filter((file) => file.endsWith('.css'))
  .map((file) => ({
    name: file,
    selectors: selectorsOf(readFileSync(join(LAYERS_DIR, file), 'utf8')),
  }));

test('every damage layer selector matches an element on the first frame of the show', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.clock.install();
  await page.goto(SHOW_URLS.show);
  await expect(page.locator(stageSelector)).toHaveCount(1);
  await expect(page.getByTestId('home-name')).toBeVisible();
  await expect(page.locator('style[data-retro-layer]')).toHaveCount(layers.length);

  const unmatched = await page.evaluate(
    (list) =>
      list.flatMap(({ name, selectors }) =>
        selectors
          .filter((selector) => document.querySelector(selector) === null)
          .map((selector) => `${name}: ${selector}`),
      ),
    layers,
  );
  expect(layers.length).toBeGreaterThan(0);
  expect(layers.filter(({ selectors }) => selectors.length === 0).map(({ name }) => name)).toEqual(
    [],
  );
  expect(unmatched, 'layer selectors that match no element on the page').toEqual([]);
  expect(errors).toEqual([]);
});
