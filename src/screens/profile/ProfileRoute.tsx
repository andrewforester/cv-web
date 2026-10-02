import type { ReactNode } from 'react';
import { ProfileScreen } from './ProfileScreen';
import { useProfileAgentTools } from './useProfileAgentTools';
import { useProfileState } from './useProfileState';

interface ProfileRouteProps {
  /** Controls the app shell puts at the right end of the meta bar (Show case, language switcher). */
  metaBarEnd?: ReactNode;
}

/** Connects the profile state holder to the stateless screen and offers the page tools to the chat. */
export function ProfileRoute({ metaBarEnd }: ProfileRouteProps) {
  const { state, highlight } = useProfileState();
  useProfileAgentTools(state.status === 'ready' ? state.profile : null, highlight);
  return <ProfileScreen state={state} metaBarEnd={metaBarEnd} />;
}
