import { useCallback, useEffect, useState } from 'react';
import { useShowRepository } from '../../data/retro';
import { useStrings } from '../../i18n';
import { highlightOf } from './engine/chunkSelectors';
import type { ShowClock } from './engine/clock';
import { planShow } from './engine/consolePlan';
import { readLiveToken } from './engine/layerHost';
import { canSend, MAX_VISITOR_CHARS } from './engine/showReducer';
import type { ShowConfig } from './engine/showTypes';
import type { RetroShowUiState } from './RetroShowUiState';
import { toRetroShowUiState } from './retroShowUi';
import { RETRO_SHOW, type ShowModuleLoaders } from './scenario';
import { retroStrings } from './strings';
import { useChunkFocus } from './useChunkFocus';
import { useDecorationPlacement } from './useDecorationPlacement';
import { useHighlightBoxes } from './useHighlightBoxes';
import { useShowLlm } from './useShowLlm';
import { useShowRunner } from './useShowRunner';
import { useShowStage } from './useShowStage';

export interface RetroShowOptions {
  loaders: ShowModuleLoaders;
  onDone?: () => void;
  /** Test seam: the runner's time source. */
  clock?: ShowClock;
}

export interface RetroShowState {
  state: RetroShowUiState;
  onDraftChange: (draft: string) => void;
  onComposerFocusChange: (focused: boolean) => void;
  onSend: () => void;
  onToggleMinimise: (window: 'chat' | 'console') => void;
}

const matches = (query: string) =>
  typeof window.matchMedia === 'function' && window.matchMedia(query).matches;

/**
 * State holder of the retro show: runs the scenario over the real page (layers, decorations,
 * modules), talks to the LLM through `ShowRepository`, and keeps the terminal chat's composer.
 */
export function useRetroShowState({ loaders, onDone, clock }: RetroShowOptions): RetroShowState {
  const strings = useStrings(retroStrings);
  const repository = useShowRepository();
  const [state, dispatch] = useShowRunner(
    (): ShowConfig => ({
      plan: planShow(RETRO_SHOW, (name) => readLiveToken(document, name)),
      copy: strings,
      reducedMotion: matches('(prefers-reduced-motion: reduce)'),
      // Crawlers and automation get the scripted show (ARCHITECTURE §4 → Bots).
      llm: !navigator.webdriver,
    }),
    clock,
  );
  useShowLlm(state, dispatch, repository);
  const { layers, layersKey, chunk } = useShowStage(state, dispatch, {
    loaders,
    onDone,
    pageTitle: strings.pageTitle,
  });
  const { reducedMotion } = state.config;
  useChunkFocus(chunk, reducedMotion, dispatch);
  // After a fade or morph applies, its targets move for a moment; the highlight and the
  // decorations follow them.
  const moving = !reducedMotion && chunk?.status === 'applied' && chunk.motion !== 'none';
  const highlight = useHighlightBoxes(highlightOf(state), moving);
  const placement = useDecorationPlacement(layersKey, layers.includes('page-frame'), moving);

  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  const [minimised, setMinimised] = useState({ chat: false, console: false });
  const composing = focused && draft.trim() !== '';
  useEffect(() => dispatch({ type: 'composing', on: composing }), [composing, dispatch]);

  const sendable = canSend(state);
  const onSend = useCallback(() => {
    if (!sendable || !draft.trim()) return;
    dispatch({ type: 'visitorSent', text: draft });
    if (draft.trim().length <= MAX_VISITOR_CHARS) setDraft('');
  }, [sendable, draft, dispatch]);

  const onToggleMinimise = useCallback(
    (window: 'chat' | 'console') =>
      setMinimised((current) => ({ ...current, [window]: !current[window] })),
    [],
  );

  return {
    state: toRetroShowUiState(
      state,
      { draft, canSend: sendable, minimised, placement, highlight },
      strings,
    ),
    onDraftChange: setDraft,
    onComposerFocusChange: setFocused,
    onSend,
    onToggleMinimise,
  };
}
