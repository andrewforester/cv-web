import { render, screen } from '@testing-library/react';
import { AppProviders } from '../../app/AppProviders';
import tokensCss from '../../theme/tokens.css?raw';
import { homeTestIds } from '../home/testIds';
import { targetQuery } from './engine/chunkSelectors';
import { effectKey, tokenDeclarations } from './engine/consolePlan';
import type { DamageLayer } from './engine/showTypes';
import { DECORATION_IDS, RETRO_SOURCE } from './scenario';
import { RetroStageTestHarness } from './RetroStageTestHarness';

// Guard 2 (docs/retro/ARCHITECTURE.md §1, §9 → Guards after the split, §11): the layers and the
// chunk targets still hit the real page. A renamed hook or token makes a layer a silent
// no-op on the page, or points the highlight and camera at nothing; here it fails instead.

type RuleLike = CSSRule & { selectorText?: string; cssRules?: CSSRuleList; name?: string };

/** Every selector of a stylesheet's style rules, also inside `@media`; keyframes are skipped. */
function selectorsOf(css: string): string[] {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  const walk = (rules: CSSRuleList): string[] =>
    (Array.from(rules) as RuleLike[]).flatMap((rule) => {
      if (rule.selectorText !== undefined) return [rule.selectorText];
      if (rule.cssRules && rule.name === undefined) return walk(rule.cssRules);
      return [];
    });
  const selectors = style.sheet ? walk(style.sheet.cssRules) : [];
  style.remove();
  return selectors;
}

/** Splits at commas outside parentheses. */
function splitTopLevel(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of list) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else current += char;
  }
  return [...parts, current.trim()];
}

/** `a :is(b, c)` → `a :where(b)`, `a :where(c)`: each alternative must match on its own. */
function expandIs(selector: string): string[] {
  const start = selector.indexOf(':is(');
  if (start < 0) return [selector];
  let depth = 0;
  let end = start + 3;
  for (; end < selector.length; end++) {
    if (selector[end] === '(') depth++;
    if (selector[end] === ')' && --depth === 0) break;
  }
  const head = selector.slice(0, start);
  const tail = selector.slice(end + 1);
  return splitTopLevel(selector.slice(start + 4, end)).flatMap((alternative) =>
    expandIs(`${head}:where(${alternative})${tail}`),
  );
}

/** Queryable selectors of a rule: one per list item and `:is()` alternative, no pseudo-elements. */
const queryable = (selectorText: string): string[] =>
  splitTopLevel(selectorText)
    .flatMap(expandIs)
    .map((selector) => selector.replace(/::(before|after)\b/g, ''));

const siteTokens = new Set(tokenDeclarations(tokensCss).map(([name]) => name));
const onPage = (selectors: readonly string[]) => selectors.filter((s) => !s.startsWith('#'));

describe('damage layers (guard 2: hook coverage)', () => {
  const { layers, steps } = RETRO_SOURCE.show;
  const ids = (display: DamageLayer['display']) =>
    Object.keys(layers).filter((id) => layers[id]?.display === display);
  const cssOf = (id: string) => layers[id]?.css ?? '';
  const targeted = steps
    .flatMap((step) => step.chunks)
    .flatMap(({ effect, target }) =>
      target && target.selectors !== 'page' ? [[effectKey(effect), target.selectors] as const] : [],
    );
  const decorationTargets = targeted.flatMap(([, selectors]) =>
    selectors.filter((s) => s.startsWith('#')),
  );

  beforeEach(async () => {
    render(
      <AppProviders locale="en">
        <RetroStageTestHarness />
      </AppProviders>,
    );
    await screen.findByTestId(homeTestIds.name);
  });

  it.each(ids('rules'))('%s: every selector matches the real page', (id) => {
    const selectors = selectorsOf(cssOf(id)).flatMap(queryable);
    expect(selectors.length).toBeGreaterThan(0);
    const missing = selectors.filter((selector) => document.querySelector(selector) === null);
    expect(missing).toEqual([]);
  });

  it.each(ids('tokens'))('%s: every token it sets exists in tokens.css', (id) => {
    const names = tokenDeclarations(cssOf(id)).map(([name]) => name);
    expect(names.length).toBeGreaterThan(0);
    expect(names.filter((name) => !siteTokens.has(name))).toEqual([]);
  });

  it.each(targeted.filter(([, selectors]) => onPage(selectors).length))(
    '%s: every target selector matches the real page under the stage',
    (_, selectors) => {
      const missing = onPage(selectors).filter(
        (s) => document.querySelector(targetQuery(s)) === null,
      );
      expect(missing).toEqual([]);
    },
  );

  it('points decoration targets only at decorations', () => {
    expect(decorationTargets.length).toBeGreaterThan(0);
    const decorations: readonly string[] = DECORATION_IDS;
    expect(decorationTargets.filter((s) => !decorations.includes(s.slice(1)))).toEqual([]);
  });
});
