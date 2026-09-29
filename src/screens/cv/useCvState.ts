import { useCallback, useEffect, useRef, useState } from 'react';
import { useCvRepository, type Cv } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useLocale } from '../../i18n';
import type { CvUiState } from './CvUiState';

/** How long a highlight stays; matches `--agent-highlight-duration` in the theme. */
const HIGHLIGHT_MS = 3000;

type Loaded = { status: 'loading' } | { status: 'error' } | { status: 'ready'; cv: Cv };

interface CvState {
  state: CvUiState;
  /** Points the page agent's highlight at a target; it clears itself after `HIGHLIGHT_MS`. */
  highlight: (id: AgentTargetId) => void;
}

/** State holder of the CV screen: loads the CV in the current locale, owns the highlight. */
export function useCvState(): CvState {
  const repository = useCvRepository();
  const { locale } = useLocale();
  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading' });
  const [highlightedId, setHighlightedId] = useState<AgentTargetId | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    let active = true;
    repository.getCv(locale).then(
      (cv) => active && setLoaded({ status: 'ready', cv }),
      () => active && setLoaded({ status: 'error' }),
    );
    return () => {
      active = false;
    };
  }, [repository, locale]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const highlight = useCallback((id: AgentTargetId) => {
    clearTimeout(timer.current);
    setHighlightedId(id);
    timer.current = setTimeout(() => setHighlightedId(null), HIGHLIGHT_MS);
  }, []);

  const state: CvUiState = loaded.status === 'ready' ? { ...loaded, highlightedId } : loaded;
  return { state, highlight };
}
