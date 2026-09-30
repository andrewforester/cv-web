import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createLayerHost } from './engine/layerHost';
import { activeLayers, runningModules } from './engine/showSelectors';
import type { ShowState } from './engine/showTypes';
import {
  DAMAGE_LAYERS,
  HOST_VARIABLES,
  type ShowModuleId,
  type ShowModuleLoaders,
} from './scenario';
import type { ShowDispatch } from './useShowRunner';

/**
 * What the show does to the page outside its own windows: the damage layers (injected before the
 * first paint, removed as steps apply), module loads, the tab title, and `onDone` at the end.
 */
export function useShowStage(
  state: ShowState,
  dispatch: ShowDispatch,
  options: { loaders: ShowModuleLoaders; onDone?: () => void; pageTitle: string },
) {
  const [host] = useState(() => createLayerHost(document, DAMAGE_LAYERS, HOST_VARIABLES));
  const layers = activeLayers(state);
  const layersKey = layers.join(' ');
  useLayoutEffect(() => {
    host.sync(layersKey ? layersKey.split(' ') : []);
  }, [host, layersKey]);
  useLayoutEffect(() => () => host.dispose(), [host]);

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
          () => dispatch({ type: 'effectFailed', key, reason: `${module} failed to load` }),
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

  return { layers, layersKey };
}
