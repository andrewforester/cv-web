import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { currentChunk, targetQuery, type CurrentChunk } from './engine/chunkSelectors';
import { createLayerHost, type StageStyles } from './engine/layerHost';
import { activeLayers, appliedTokens, runningModules } from './engine/showSelectors';
import type { DamageLayer, ShowState, TokenValue } from './engine/showTypes';
import motionStyles from './RetroMotion.module.css';
import { HOST_VARIABLES, type ShowModuleId, type ShowModuleLoaders } from './scenario';
import { useBodyClass } from './useBodyClass';
import type { ShowDispatch } from './useShowRunner';

const SEPARATOR = '\n';

/**
 * The morph that removes the current chunk's layer (it has just applied): its targets' queries,
 * joined; `''` for a page-wide morph; `null` when the layers change without one.
 */
function morphTargets(chunk: CurrentChunk | null, reducedMotion: boolean): string | null {
  if (reducedMotion || chunk?.motion !== 'morph' || chunk.status !== 'applied') return null;
  const selectors = chunk.target?.selectors;
  return !selectors || selectors === 'page' ? '' : selectors.map(targetQuery).join(SEPARATOR);
}

/**
 * What the show does to the page outside its own windows: the damage layers (injected before the
 * first paint, removed as chunks apply, with a fade or a morph) and the tokens the console's
 * `style.setProperty` calls set (cleared at the end), module loads, the tab title, and `onDone`.
 */
export function useShowStage(
  state: ShowState,
  dispatch: ShowDispatch,
  options: {
    /** The scenario's damage layers. */
    layers: Readonly<Record<string, DamageLayer>>;
    loaders: ShowModuleLoaders;
    onDone?: () => void;
    pageTitle: string;
  },
) {
  const [host] = useState(() => createLayerHost(document, options.layers, HOST_VARIABLES));
  const layers = activeLayers(state);
  const layersKey = layers.join(' ');
  const tokensKey = JSON.stringify(appliedTokens(state));
  const { reducedMotion } = state.config;
  const chunk = currentChunk(state);
  const morph = morphTargets(chunk, reducedMotion);
  useLayoutEffect(() => {
    const styles: StageStyles = {
      layers: layersKey ? layersKey.split(' ') : [],
      tokens: JSON.parse(tokensKey) as TokenValue[],
    };
    if (morph === null) {
      host.sync(styles);
      return;
    }
    // The view-transition styles live on the root, where the transition's pseudo-elements are.
    const root = document.documentElement;
    const morphClass = motionStyles.morph ?? '';
    if (morphClass) root.classList.add(morphClass);
    void host
      .morph(styles, morph ? morph.split(SEPARATOR) : [])
      .finally(() => morphClass && root.classList.remove(morphClass));
  }, [host, layersKey, tokensKey, morph]);
  useLayoutEffect(() => () => host.dispose(), [host]);
  // Transitions are on from a fade chunk's start to its beat's end, so its layer's removal animates.
  useBodyClass(motionStyles.fade, !reducedMotion && chunk?.motion === 'fade');

  const { loaders, onDone, pageTitle } = options;
  const callbacks = useRef({ loaders, onDone });
  useEffect(() => {
    callbacks.current = { loaders, onDone };
  });

  const started = useRef(new Set<string>());
  useEffect(() => {
    for (const { key, module } of runningModules(state)) {
      if (started.current.has(key)) continue;
      started.current.add(key);
      const load = callbacks.current.loaders[module as ShowModuleId];
      Promise.resolve()
        .then(load)
        .then(
          () => dispatch({ type: 'moduleLoaded', key }),
          () => dispatch({ type: 'effectFailed', key, reason: 'failed to load' }),
        );
    }
  }, [state, dispatch]);

  const done = state.phase === 'done';
  useEffect(() => {
    if (done) return;
    const previous = document.title;
    document.title = pageTitle;
    return () => {
      document.title = previous;
    };
  }, [done, pageTitle]);

  useEffect(() => {
    if (done) callbacks.current.onDone?.();
  }, [done]);

  return { layers, layersKey, chunk };
}
