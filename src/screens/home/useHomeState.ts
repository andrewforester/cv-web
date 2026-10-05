import { useEffect, useState } from 'react';
import { useCvPageRepository, type CvPage } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useAgentHighlight } from '../../shared/agentTarget';
import type { HomeUiState } from './HomeUiState';

type Loaded = { status: 'loading' } | { status: 'error' } | { status: 'ready'; page: CvPage };

interface HomeState {
  state: HomeUiState;
  /** Points the page agent's highlight at a target; it clears itself after a few seconds. */
  highlight: (id: AgentTargetId) => void;
}

/** State holder of the one CV page: loads the page's data, owns the page agent's highlight. */
export function useHomeState(): HomeState {
  const repository = useCvPageRepository();
  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading' });
  const { highlightedId, highlight } = useAgentHighlight();

  useEffect(() => {
    let active = true;
    repository.getCvPage().then(
      (page) => active && setLoaded({ status: 'ready', page }),
      () => active && setLoaded({ status: 'error' }),
    );
    return () => {
      active = false;
    };
  }, [repository]);

  const state: HomeUiState = loaded.status === 'ready' ? { ...loaded, highlightedId } : loaded;
  return { state, highlight };
}
