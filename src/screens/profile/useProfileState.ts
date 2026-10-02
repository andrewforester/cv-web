import { useEffect, useState } from 'react';
import { useProfileRepository } from '../../data';
import { useLocale } from '../../i18n';
import type { ProfileUiState } from './ProfileUiState';

/** State holder of the profile screen (`/new`): loads the profile in the current locale. */
export function useProfileState(): ProfileUiState {
  const repository = useProfileRepository();
  const { locale } = useLocale();
  const [state, setState] = useState<ProfileUiState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    repository.getProfile(locale).then(
      (profile) => active && setState({ status: 'ready', profile }),
      () => active && setState({ status: 'error' }),
    );
    return () => {
      active = false;
    };
  }, [repository, locale]);

  return state;
}
