import { useEffect, useState } from 'react';
import { useCvRepository } from '../../data';
import { useLocale } from '../../i18n';
import type { CvUiState } from './CvUiState';

/** State holder of the CV screen: loads the CV in the current locale. */
export function useCvState(): CvUiState {
  const repository = useCvRepository();
  const { locale } = useLocale();
  const [state, setState] = useState<CvUiState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    repository.getCv(locale).then(
      (cv) => active && setState({ status: 'ready', cv }),
      () => active && setState({ status: 'error' }),
    );
    return () => {
      active = false;
    };
  }, [repository, locale]);

  return state;
}
