import type { DamageLayer } from './showTypes';

export const LAYER_ATTRIBUTE = 'data-retro-layer';
export const HOST_ATTRIBUTE = 'data-retro-host';
export const MOTION_ATTRIBUTE = 'data-retro-motion';

/** The bursts' blink (the `new-bursts` layer names it); defined only when motion is allowed. */
const BLINK_KEYFRAMES =
  '@media (prefers-reduced-motion: no-preference) { @keyframes retro-blink { 50% { visibility: hidden; } } }';

export interface LayerHost {
  /** Makes the injected layers exactly `ids`, in scenario order; new ones go to the end of `<head>`. */
  sync(ids: readonly string[]): void;
  /**
   * `sync(ids)` as a morph (ARCHITECTURE §9 → Motion): inside a same-document view transition,
   * with the elements matching `queries` morphing on their own where the browser names them
   * automatically. Instant where view transitions are missing or reduced motion is on. Resolves
   * when the transition has finished (or was skipped by the next one).
   */
  morph(ids: readonly string[], queries: readonly string[]): Promise<void>;
  /** Removes every layer, the host variables and any motion style. */
  dispose(): void;
}

const motionAllowed = (win: Window | null) =>
  !!win &&
  !(
    typeof win.matchMedia === 'function' &&
    win.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

/** Whether each target can get its own view-transition group (`view-transition-name: match-element`). */
const namesElements = () =>
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('view-transition-name', 'match-element');

/**
 * Owns the damage layers on the page (ARCHITECTURE §1): one `<style data-retro-layer="<id>">` per
 * active layer, holding the same CSS string the console types, plus the host variables (bundled
 * asset URLs the layers read, e.g. `--retro-broken-image`) and the `retro-blink` keyframes in one
 * `<style data-retro-host>`; during a morph, a `<style data-retro-motion>` naming its targets.
 */
export function createLayerHost(
  doc: Document,
  layers: Readonly<Record<string, DamageLayer>>,
  hostVariables: Readonly<Record<string, string>>,
): LayerHost {
  const injected = new Map<string, HTMLStyleElement>();
  const motions = new Set<HTMLStyleElement>();
  let host: HTMLStyleElement | null = null;

  const style = (attribute: string, value: string, css: string) => {
    const element = doc.createElement('style');
    element.setAttribute(attribute, value);
    element.textContent = css;
    doc.head.append(element);
    return element;
  };

  const sync = (ids: readonly string[]) => {
    if (!host && ids.length) {
      const declarations = Object.entries(hostVariables).map(
        ([name, value]) => `${name}: ${value};`,
      );
      host = style(HOST_ATTRIBUTE, '', `:root { ${declarations.join(' ')} }\n${BLINK_KEYFRAMES}`);
    }
    for (const [id, element] of injected) {
      if (ids.includes(id)) continue;
      element.remove();
      injected.delete(id);
    }
    for (const id of ids) {
      const layer = layers[id];
      if (injected.has(id) || !layer) continue;
      injected.set(id, style(LAYER_ATTRIBUTE, id, layer.css));
    }
    if (!injected.size) {
      host?.remove();
      host = null;
    }
  };

  return {
    sync,
    morph(ids, queries) {
      const win = doc.defaultView;
      if (typeof doc.startViewTransition !== 'function' || !motionAllowed(win)) {
        sync(ids);
        return Promise.resolve();
      }
      // Duplicate fixed names would abort the transition: without automatic names the page
      // cross-fades as a whole.
      const naming =
        queries.length && namesElements()
          ? style(
              MOTION_ATTRIBUTE,
              '',
              `${queries.join(', ')} { view-transition-name: match-element; }`,
            )
          : null;
      if (naming) motions.add(naming);
      const transition = doc.startViewTransition(() => sync(ids));
      return transition.finished
        .catch(() => undefined)
        .finally(() => {
          naming?.remove();
          if (naming) motions.delete(naming);
        });
    },
    dispose() {
      for (const element of [...injected.values(), ...motions]) element.remove();
      injected.clear();
      motions.clear();
      host?.remove();
      host = null;
    },
  };
}

type RuleLike = CSSRule & {
  selectorText?: string;
  style?: CSSStyleDeclaration;
  cssRules?: CSSRuleList;
  media?: MediaList;
};

function scanRules(rules: CSSRuleList, name: string, win: Window): string | undefined {
  let value: string | undefined;
  for (const rule of Array.from(rules) as RuleLike[]) {
    if (rule.selectorText === ':root' && rule.style) {
      value = rule.style.getPropertyValue(name).trim() || value;
    } else if (rule.cssRules && rule.media) {
      const matches =
        typeof win.matchMedia === 'function' && win.matchMedia(rule.media.mediaText).matches;
      if (matches) value = scanRules(rule.cssRules, name, win) ?? value;
    }
  }
  return value;
}

/**
 * The site's own value of a design token: the last `:root` declaration in the page's stylesheets,
 * skipping the damage layers. The console prints it as the `+` side of a token diff.
 */
export function readLiveToken(doc: Document, name: string): string | undefined {
  const win = doc.defaultView;
  if (!win) return undefined;
  let value: string | undefined;
  for (const sheet of Array.from(doc.styleSheets)) {
    const owner = sheet.ownerNode;
    if (owner instanceof win.Element && owner.hasAttribute(LAYER_ATTRIBUTE)) continue;
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    value = scanRules(rules, name, win) ?? value;
  }
  return value?.replace(/\s+/g, ' ');
}
