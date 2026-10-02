import { SHOW_SCENARIOS } from '../../data/retro';
import { effectKey } from './engine/consolePlan';
import { DECORATION_IDS, SHOW_MODULES } from './scenario';
import { registeredSources, type RetroShowSource } from './scenarios';

// Guard 1 (docs/retro/ARCHITECTURE.md §1, §9 → Guards after the split, §10): per page, the
// scenario removes exactly what its show starts with, every chunk says where it lands, and its
// motion fits its CSS.
const sources = registeredSources();
const chunksOf = ({ show }: RetroShowSource) => show.steps.flatMap((step) => step.chunks);
const layerFiles = Object.keys(import.meta.glob('./layers/**/*.css', { query: '?raw' })).map(
  (path) => path.replace(/^.*\/|\.css$/g, ''),
);

/** The declarations of a stylesheet: `[property, value]` from every `{ … }` block. */
function declarations(css: string): [property: string, value: string][] {
  return [...css.matchAll(/\{([^{}]*)\}/g)].flatMap(([, block = '']) =>
    block.split(';').flatMap((declaration): [string, string][] => {
      const colon = declaration.indexOf(':');
      if (colon < 0) return [];
      return [[declaration.slice(0, colon).trim(), declaration.slice(colon + 1).trim()]];
    }),
  );
}

/**
 * A change that can't interpolate, so it must morph (§9: font family, layout, `display` …; §10: a
 * gradient token, whose value is a gradient).
 */
function isStructural([property, value]: [string, string]): boolean {
  return (
    /^(font-family|--forest-font-\w+|--forest-gradient-[\w-]+|display|float|text-align|content|object-position|object-fit|flex-direction|flex-wrap|width)$/.test(
      property,
    ) ||
    /^(grid-template-|list-style)/.test(property) ||
    (property === 'max-width' && value === 'none') ||
    (/^background(-image)?$/.test(property) && /url\(|var\(--retro-|gradient\(/.test(value))
  );
}

it('registers every layer file under layers/ with at least one scenario, and nothing else', () => {
  const registered = new Set(sources.flatMap(([, { show }]) => Object.keys(show.layers)));
  expect([...new Set(layerFiles)].sort()).toEqual([...registered].sort());
});

describe.each(sources)('%s scenario (guard 1: completeness)', (scenario, source) => {
  const chunks = chunksOf(source);
  const effects = chunks.map(({ effect }) => effect);
  const { layers } = source.show;

  it('has chunks for exactly the manifest steps, in manifest order', () => {
    const manifestIds = SHOW_SCENARIOS[scenario].steps.map(({ id }) => id);
    expect(source.show.steps.map(({ id }) => id)).toEqual(manifestIds);
    expect(source.show.meta).toBe(SHOW_SCENARIOS[scenario].steps);
    for (const step of source.show.steps) expect(step.chunks.length).toBeGreaterThan(0);
    expect(chunks).toHaveLength(36);
  });

  it('removes every damage layer exactly once', () => {
    const removed = effects.flatMap((e) => (e.kind === 'removeLayer' ? [e.layer] : []));
    expect([...removed].sort()).toEqual(Object.keys(layers).sort());
    for (const [id, layer] of Object.entries(layers)) {
      expect(layer.id).toBe(id);
      expect(layer.display === 'tokens').toBe(layer.css.trimStart().startsWith(':root'));
    }
  });

  it('removes every decoration exactly once', () => {
    const removed = effects.flatMap((e) => (e.kind === 'removeDecoration' ? [e.decoration] : []));
    expect([...removed].sort()).toEqual([...DECORATION_IDS].sort());
  });

  it('loads every show module exactly once, and the last chunk ends the show on the real site', () => {
    const loaded = effects.flatMap((e) => (e.kind === 'loadModule' ? [e.module] : []));
    expect(loaded).toEqual(Object.keys(SHOW_MODULES));
    expect(chunks.at(-1)?.effect).toEqual({ kind: 'loadModule', module: 'ai-chat' });
  });

  it('has unique chunk keys', () => {
    const keys = effects.map(effectKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe.each(sources)('%s scenario (guard 1: targets and motion)', (_, source) => {
  const chunks = chunksOf(source);
  const { layers } = source.show;

  it('gives every layer and decoration chunk a labelled target; only the module has none', () => {
    for (const { effect, target } of chunks) {
      if (effect.kind === 'loadModule') {
        expect(target).toBeNull();
        continue;
      }
      expect(target?.label.trim(), effectKey(effect)).toBeTruthy();
      expect(target?.selectors.length, effectKey(effect)).toBeGreaterThan(0);
    }
  });

  it('points a decoration chunk at its own element', () => {
    for (const { effect, target } of chunks) {
      if (effect.kind !== 'removeDecoration') continue;
      expect(target?.selectors).toEqual([`#${effect.decoration}`]);
    }
  });

  it('sets a motion on layer chunks only', () => {
    for (const chunk of chunks) {
      const key = effectKey(chunk.effect);
      if (chunk.effect.kind === 'removeLayer') expect(chunk.motion, key).toMatch(/^(fade|morph)$/);
      else expect(chunk.motion, key).toBeUndefined();
    }
  });

  it.each(
    chunks.flatMap((chunk) =>
      chunk.effect.kind === 'removeLayer' ? [[chunk.effect.layer, chunk.motion] as const] : [],
    ),
  )('%s: %s fits its CSS (structural changes morph, the rest fades)', (id, motion) => {
    const css = layers[id]?.css ?? '';
    const structural = declarations(css).filter(isStructural);
    expect(structural.length > 0 ? 'morph' : 'fade').toBe(motion);
  });
});
