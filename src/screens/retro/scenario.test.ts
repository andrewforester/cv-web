import { RETRO_STEP_IDS } from '../../data/retro';
import { effectKey } from './engine/consolePlan';
import { DAMAGE_LAYERS, DECORATION_IDS, RETRO_EFFECTS, SHOW_MODULES } from './scenario';

// Guard 1 (docs/retro/ARCHITECTURE.md §1): the scenario removes exactly what the show starts with.
const effects = RETRO_EFFECTS.flatMap((step) => step.effects);
const layerFiles = Object.keys(import.meta.glob('./layers/*.css', { query: '?raw' })).map((path) =>
  path.replace(/^\.\/layers\/|\.css$/g, ''),
);

describe('retro scenario (guard 1: completeness)', () => {
  it('has effects for exactly the manifest steps, in manifest order', () => {
    expect(RETRO_EFFECTS.map(({ id }) => id)).toEqual([...RETRO_STEP_IDS]);
    for (const step of RETRO_EFFECTS) expect(step.effects.length).toBeGreaterThan(0);
  });

  it('removes every damage layer exactly once, and every layer file is registered', () => {
    const removed = effects.flatMap((e) => (e.kind === 'removeLayer' ? [e.layer] : []));
    expect([...removed].sort()).toEqual(Object.keys(DAMAGE_LAYERS).sort());
    expect(layerFiles.sort()).toEqual(Object.keys(DAMAGE_LAYERS).sort());
    for (const [id, layer] of Object.entries(DAMAGE_LAYERS)) expect(layer.id).toBe(id);
  });

  it('removes every decoration exactly once', () => {
    const removed = effects.flatMap((e) => (e.kind === 'removeDecoration' ? [e.decoration] : []));
    expect([...removed].sort()).toEqual([...DECORATION_IDS].sort());
  });

  it('loads every show module exactly once, and the last step ends the show on the real site', () => {
    const loaded = effects.flatMap((e) => (e.kind === 'loadModule' ? [e.module] : []));
    expect(loaded).toEqual(Object.keys(SHOW_MODULES));
    expect(RETRO_EFFECTS.at(-1)?.effects.at(-1)).toEqual({ kind: 'loadModule', module: 'ai-chat' });
  });

  it('has unique effect keys', () => {
    const keys = effects.map(effectKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
