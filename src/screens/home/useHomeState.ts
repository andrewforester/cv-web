import { useEffect, useState } from 'react';
import { useCvPageRepository, type CvPage } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useAgentHighlight } from '../../shared/agentTarget';
import type { HomeNavSection } from './homeNav';
import type { HomeUiState } from './HomeUiState';
import { useActiveSection } from './useActiveSection';

type Loaded = { status: 'loading' } | { status: 'error' } | { status: 'ready'; page: CvPage };

interface HomeState {
  state: HomeUiState;
  /** Points the page agent's highlight at a target; it clears itself after a few seconds. */
  highlight: (id: AgentTargetId) => void;
  /** The toolbar's pick: scrolls to the section. */
  goToSection: (section: HomeNavSection) => void;
}

/**
 * State holder of the one CV page: loads the page's data, owns the page agent's highlight and the
 * toolbar's active section.
 */
export function useHomeState(): HomeState {
  const repository = useCvPageRepository();
  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading' });
  const { highlightedId, highlight } = useAgentHighlight();
  const { activeSection, goToSection } = useActiveSection(loaded.status === 'ready');

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

  const state: HomeUiState =
    loaded.status === 'ready' ? { ...loaded, highlightedId, activeSection } : loaded;
  return { state, highlight, goToSection };
}
