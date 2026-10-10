import { useCallback, useEffect, useState } from 'react';
import { useShowRepository, type ShowScenarioId } from '../../data/retro';
import { useStrings } from '../../i18n';
import { highlightOf } from './engine/chunkSelectors';
import type { ShowClock } from './engine/clock';
import { planShow } from './engine/consolePlan';
import { readLiveToken } from './engine/layerHost';
import type { ShowConfig } from './engine/showTypes';
import type { RetroShowUiState } from './RetroShowUiState';
import { toRetroShowUiState } from './retroShowUi';
import type { RetroShowSource, ShowModuleLoaders } from './scenario';
import { retroStrings } from './strings';
import { useChunkFocus } from './useChunkFocus';
import { useDecorationPlacement } from './useDecorationPlacement';
import { useHighlightBoxes } from './useHighlightBoxes';
import { useShowLlm } from './useShowLlm';
import { useShowRunner } from './useShowRunner';
import { useShowStage } from './useShowStage';
import { useTokenShield } from './useTokenShield';

export interface RetroShowOptions {
  /** The running scenario (its wire id) and what its steps do to its page. */
  scenario: ShowScenarioId;
  source: RetroShowSource;
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
  onToggleMinimise: () => void;
}

const matches = (query: string) =>
  typeof window.matchMedia === 'function' && window.matchMedia(query).matches;

/**
 * State holder of the retro show: runs a page's scenario over the real page (layers, decorations,
 * modules), talks to the LLM through `ShowRepository`, and keeps the agent chat's composer.
 */
export function useRetroShowState({
  scenario,
  source,
  loaders,
  onDone,
  clock,
}: RetroShowOptions): RetroShowState {
  const strings = useStrings(retroStrings);
  const repository = useShowRepository();
  const [state, dispatch] = useShowRunner(
    (): ShowConfig => ({
      plan: planShow(source.show, (name) => readLiveToken(document, name)),
      copy: strings,
      reducedMotion: matches('(prefers-reduced-motion: reduce)'),
      // Crawlers and automation get the scripted show (ARCHITECTURE §4 → Bots).
      llm: !navigator.webdriver,
    }),
    clock,
  );
  useShowLlm(state, dispatch, repository, scenario);
  const { layers, layersKey, chunk } = useShowStage(state, dispatch, {
    layers: source.show.layers,
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
  const placement = useDecorationPlacement(
    source.anchors,
    layersKey,
    layers.includes('page-frame'),
    moving,
  );

  const tokens = useTokenShield();

  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const composing = focused && draft.trim() !== '';
  useEffect(() => dispatch({ type: 'composing', on: composing }), [composing, dispatch]);

  const ui = toRetroShowUiState(
    state,
    { draft, minimised, placement, highlight, tokens },
    strings,
    source.copy,
  );
  const sendable = ui.chat.canSend;
  const onSend = useCallback(() => {
    if (!sendable) return;
    dispatch({ type: 'visitorSent', text: draft });
    setDraft('');
  }, [sendable, draft, dispatch]);

  const onToggleMinimise = useCallback(() => setMinimised((current) => !current), []);

  return {
    state: ui,
    onDraftChange: setDraft,
    onComposerFocusChange: setFocused,
    onSend,
    onToggleMinimise,
  };
}
