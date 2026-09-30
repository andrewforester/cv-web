import { render, screen } from '@testing-library/react';
import { AppProviders } from '../../app/AppProviders';
import tokensCss from '../../theme/tokens.css?raw';
import { cvTestIds } from '../cv/testIds';
import { tokenDeclarations } from './engine/consolePlan';
import type { DamageLayer } from './engine/showTypes';
import { DAMAGE_LAYERS } from './scenario';
import { RetroStageTestHarness } from './RetroStageTestHarness';

// Guard 2 (docs/retro/ARCHITECTURE.md §1): the layers still hit the real site. A renamed hook or
// token makes a layer a silent no-op on the page; here it fails instead.

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

const ids = (display: DamageLayer['display']) =>
  Object.values(DAMAGE_LAYERS)
    .filter((layer) => layer.display === display)
    .map(({ id }) => id);
const siteTokens = new Set(tokenDeclarations(tokensCss).map(([name]) => name));

describe('damage layers (guard 2: hook coverage)', () => {
  beforeEach(async () => {
    render(
      <AppProviders locale="en">
        <RetroStageTestHarness />
      </AppProviders>,
    );
    await screen.findByTestId(cvTestIds.name);
  });

  it.each(ids('rules'))('%s: every selector matches the real CV', (id) => {
    const selectors = selectorsOf(DAMAGE_LAYERS[id].css).flatMap(queryable);
    expect(selectors.length).toBeGreaterThan(0);
    const missing = selectors.filter((selector) => document.querySelector(selector) === null);
    expect(missing).toEqual([]);
  });

  it.each(ids('tokens'))('%s: every token it sets exists in tokens.css', (id) => {
    const names = tokenDeclarations(DAMAGE_LAYERS[id].css).map(([name]) => name);
    expect(names.length).toBeGreaterThan(0);
    expect(names.filter((name) => !siteTokens.has(name))).toEqual([]);
  });
});
