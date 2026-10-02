import type { ChunkTarget, LayerMotion, RetroChunk } from './engine/showTypes';
import type { DecorationId, ShowModuleId } from './scenario';

// The words every page's fix list is written in (`scenarioSteps.ts` for `/`,
// `scenarioNewSteps.ts` for `/new`): a target, a layer chunk with its motion, a decoration that
// leaves, a module that loads.

/** A page-wide chunk: the highlight tints the page area, the plate sits at its corner. */
export const PAGE: ChunkTarget = { label: 'page', selectors: 'page' };
/** A target: the `// → <label>` console line and the selectors the highlight marks. */
export const on = (label: string, ...selectors: string[]): ChunkTarget => ({ label, selectors });

/** `fade` and `morph` chunks over one scenario's layer ids. */
export function layerChunks<LayerId extends string>() {
  const layer =
    (motion: LayerMotion) =>
    (id: LayerId, target: ChunkTarget): RetroChunk => ({
      effect: { kind: 'removeLayer', layer: id },
      target,
      motion,
    });
  return { fade: layer('fade'), morph: layer('morph') };
}

export const leave = (id: DecorationId, label: string): RetroChunk => ({
  effect: { kind: 'removeDecoration', decoration: id },
  target: on(label, `#${id}`),
});
export const load = (id: ShowModuleId): RetroChunk => ({
  effect: { kind: 'loadModule', module: id },
  target: null,
});
