import type { ReactNode } from 'react';
import { ProfileScreen } from './ProfileScreen';
import { useProfileState } from './useProfileState';

interface ProfileRouteProps {
  /** Controls the app shell puts at the right end of the meta bar (the language switcher). */
  metaBarEnd?: ReactNode;
}

/** Connects the profile state holder to the stateless screen. */
export function ProfileRoute({ metaBarEnd }: ProfileRouteProps) {
  return <ProfileScreen state={useProfileState()} metaBarEnd={metaBarEnd} />;
}
