import { commonStrings, useStrings } from '../../i18n';
import type { HomeUiState } from './HomeUiState';
import styles from './HomeScreen.module.css';
import { homeStrings } from './strings';
import { homeTestIds } from './testIds';

interface HomeScreenProps {
  className?: string;
  state: HomeUiState;
}

/** Hello screen: the CV owner's name and title. Stateless. */
export function HomeScreen({ className, state }: HomeScreenProps) {
  const strings = useStrings(homeStrings);
  const common = useStrings(commonStrings);

  return (
    <section
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-testid={homeTestIds.root}
    >
      {state.status === 'ready' ? (
        <>
          <p className={styles.greeting}>{strings.greeting}</p>
          <h1 className={styles.name} data-testid={homeTestIds.name}>
            {state.name}
          </h1>
          <p className={styles.title} data-testid={homeTestIds.title}>
            {state.title}
          </p>
        </>
      ) : (
        <p className={styles.status} role="status" data-testid={homeTestIds.status}>
          {state.status === 'loading' ? common.loading : common.loadError}
        </p>
      )}
    </section>
  );
}
