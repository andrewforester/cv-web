import { commonStrings, useStrings } from '../../i18n';
import styles from './CvScreen.module.css';
import type { CvUiState } from './CvUiState';
import { HeaderSection } from './HeaderSection';
import { LatestExperienceSection } from './LatestExperienceSection';
import { SummarySection } from './SummarySection';
import { TechnologiesSection } from './TechnologiesSection';
import { cvTestIds } from './testIds';

interface CvScreenProps {
  className?: string;
  state: CvUiState;
}

/** The CV page: sections top to bottom in SPEC order. Stateless. */
export function CvScreen({ className, state }: CvScreenProps) {
  const common = useStrings(commonStrings);

  if (state.status !== 'ready') {
    return (
      <p className={styles.status} role="status" data-testid={cvTestIds.status}>
        {state.status === 'loading' ? common.loading : common.loadError}
      </p>
    );
  }

  const { cv } = state;
  return (
    <article
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-testid={cvTestIds.root}
    >
      <HeaderSection header={cv.header} />
      <SummarySection summary={cv.summary} />
      <TechnologiesSection cards={cv.technologies} />
      <LatestExperienceSection entries={cv.latestExperience} />
      {/* Part 2 (#8): Apps, Education, About me, Previous Experience go here. */}
    </article>
  );
}
