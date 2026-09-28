import { useEffect, useState } from 'react';
import { useCvRepository } from '../../data';
import { useLocale } from '../../i18n';
import type { HomeUiState } from './HomeUiState';

/** State holder of the home screen: loads the CV in the current locale. */
export function useHomeState(): HomeUiState {
  const repository = useCvRepository();
  const { locale } = useLocale();
  const [state, setState] = useState<HomeUiState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    repository.getCv(locale).then(
      (cv) => active && setState({ status: 'ready', name: cv.name, title: cv.title }),
      () => active && setState({ status: 'error' }),
    );
    return () => {
      active = false;
    };
  }, [repository, locale]);

  return state;
}
