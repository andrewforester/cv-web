import { ProfileScreen } from './ProfileScreen';
import { useProfileState } from './useProfileState';

/** Connects the profile state holder to the stateless screen. */
export function ProfileRoute() {
  return <ProfileScreen state={useProfileState()} />;
}
