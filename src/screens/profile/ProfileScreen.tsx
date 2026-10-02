import { commonStrings, useStrings } from '../../i18n';
import styles from './ProfileScreen.module.css';
import type { ProfileUiState } from './ProfileUiState';
import { profileTestIds } from './testIds';

interface ProfileScreenProps {
  className?: string;
  state: ProfileUiState;
}

/** The `/new` page. Placeholder until the Forest sections land: name, headline, subtitle. */
export function ProfileScreen({ className, state }: ProfileScreenProps) {
  const common = useStrings(commonStrings);

  if (state.status !== 'ready') {
    return (
      <p className={styles.status} role="status" data-testid={profileTestIds.status}>
        {state.status === 'loading' ? common.loading : common.loadError}
      </p>
    );
  }

  const { profile } = state;
  return (
    <article className={className} data-testid={profileTestIds.root}>
      <p data-testid={profileTestIds.name}>{profile.name}</p>
      <h1 data-testid={profileTestIds.headline}>
        {profile.headline.map((part) => part.text).join('')}
      </h1>
      <p data-testid={profileTestIds.subtitle}>{profile.subtitle}</p>
    </article>
  );
}
