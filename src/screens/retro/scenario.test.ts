import { RETRO_STEP_IDS } from '../../data/retro';
import { effectKey } from './engine/consolePlan';
import { DAMAGE_LAYERS, DECORATION_IDS, SHOW_MODULES, type DamageLayerId } from './scenario';
import { RETRO_CHUNKS } from './scenarioSteps';

// Guard 1 (docs/retro/ARCHITECTURE.md §1, §9 → Guards after the split): the scenario removes
// exactly what the show starts with, every chunk says where it lands, and its motion fits its CSS.
const chunks = RETRO_CHUNKS.flatMap((step) => step.chunks);
const effects = chunks.map(({ effect }) => effect);
const layerFiles = Object.keys(import.meta.glob('./layers/*.css', { query: '?raw' })).map((path) =>
  path.replace(/^\.\/layers\/|\.css$/g, ''),
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

/** A change that can't interpolate, so it must morph (§9: font family, layout, `display` …). */
function isStructural([property, value]: [string, string]): boolean {
  return (
    /^(font-family|--font-family|display|float|text-align|content|object-position|object-fit)$/.test(
      property,
    ) ||
    /^(grid-template-|list-style)/.test(property) ||
    (property === 'max-width' && value === 'none') ||
    (/^background(-image)?$/.test(property) && /url\(|var\(--retro-|gradient\(/.test(value))
  );
}

describe('retro scenario (guard 1: completeness)', () => {
  it('has chunks for exactly the manifest steps, in manifest order', () => {
    expect(RETRO_CHUNKS.map(({ id }) => id)).toEqual([...RETRO_STEP_IDS]);
    for (const step of RETRO_CHUNKS) expect(step.chunks.length).toBeGreaterThan(0);
    expect(chunks).toHaveLength(36);
  });

  it('removes every damage layer exactly once, and every layer file is registered', () => {
    const removed = effects.flatMap((e) => (e.kind === 'removeLayer' ? [e.layer] : []));
    expect([...removed].sort()).toEqual(Object.keys(DAMAGE_LAYERS).sort());
    expect(layerFiles.sort()).toEqual(Object.keys(DAMAGE_LAYERS).sort());
    for (const [id, layer] of Object.entries(DAMAGE_LAYERS)) {
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

describe('retro scenario (guard 1: targets and motion)', () => {
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
    const structural = declarations(DAMAGE_LAYERS[id as DamageLayerId].css).filter(isStructural);
    expect(structural.length > 0 ? 'morph' : 'fade').toBe(motion);
  });
});
