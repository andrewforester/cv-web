import type { DamageLayer } from './showTypes';

export const LAYER_ATTRIBUTE = 'data-retro-layer';
export const HOST_ATTRIBUTE = 'data-retro-host';

export interface LayerHost {
  /** Makes the injected layers exactly `ids`, in scenario order; new ones go to the end of `<head>`. */
  sync(ids: readonly string[]): void;
  /** Removes every layer and the host variables. */
  dispose(): void;
}

/**
 * Owns the damage layers on the page (ARCHITECTURE §1): one `<style data-retro-layer="<id>">` per
 * active layer, holding the same CSS string the console types, plus the host variables (bundled
 * asset URLs the layers read, e.g. `--retro-broken-image`) in one `<style data-retro-host>`.
 */
export function createLayerHost(
  doc: Document,
  layers: Readonly<Record<string, DamageLayer>>,
  hostVariables: Readonly<Record<string, string>>,
): LayerHost {
  const injected = new Map<string, HTMLStyleElement>();
  let host: HTMLStyleElement | null = null;

  const style = (attribute: string, value: string, css: string) => {
    const element = doc.createElement('style');
    element.setAttribute(attribute, value);
    element.textContent = css;
    doc.head.append(element);
    return element;
  };

  return {
    sync(ids) {
      if (!host && ids.length) {
        const declarations = Object.entries(hostVariables).map(([name, value]) => `${name}: ${value};`);
        host = style(HOST_ATTRIBUTE, '', `:root { ${declarations.join(' ')} }`);
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
    },
    dispose() {
      for (const element of injected.values()) element.remove();
      injected.clear();
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
      const matches = typeof win.matchMedia !== 'function' || win.matchMedia(rule.media.mediaText).matches;
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
