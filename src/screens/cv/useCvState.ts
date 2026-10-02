import { useEffect, useState } from 'react';
import { useCvRepository, type Cv } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useLocale } from '../../i18n';
import { useAgentHighlight } from '../../shared/agentTarget';
import type { CvUiState } from './CvUiState';

type Loaded = { status: 'loading' } | { status: 'error' } | { status: 'ready'; cv: Cv };

interface CvState {
  state: CvUiState;
  /** Points the page agent's highlight at a target; it clears itself after a few seconds. */
  highlight: (id: AgentTargetId) => void;
}

/** State holder of the CV screen: loads the CV in the current locale, owns the highlight. */
export function useCvState(): CvState {
  const repository = useCvRepository();
  const { locale } = useLocale();
  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading' });
  const { highlightedId, highlight } = useAgentHighlight();

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

  const state: CvUiState = loaded.status === 'ready' ? { ...loaded, highlightedId } : loaded;
  return { state, highlight };
}
