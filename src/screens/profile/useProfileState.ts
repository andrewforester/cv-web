import { useEffect, useState } from 'react';
import { useProfileRepository, type Profile } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useLocale } from '../../i18n';
import { useAgentHighlight } from '../../shared/agentTarget';
import type { ProfileUiState } from './ProfileUiState';

type Loaded = { status: 'loading' } | { status: 'error' } | { status: 'ready'; profile: Profile };

interface ProfileState {
  state: ProfileUiState;
  /** Points the page agent's highlight at a target; it clears itself after a few seconds. */
  highlight: (id: AgentTargetId) => void;
}

/**
 * State holder of the profile screen (`/new`): loads the profile in the current locale, owns the
 * page agent's highlight.
 */
export function useProfileState(): ProfileState {
  const repository = useProfileRepository();
  const { locale } = useLocale();
  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading' });
  const { highlightedId, highlight } = useAgentHighlight();

  useEffect(() => {
    let active = true;
    repository.getProfile(locale).then(
      (profile) => active && setLoaded({ status: 'ready', profile }),
      () => active && setLoaded({ status: 'error' }),
    );
    return () => {
      active = false;
    };
  }, [repository, locale]);

  const state: ProfileUiState = loaded.status === 'ready' ? { ...loaded, highlightedId } : loaded;
  return { state, highlight };
}
