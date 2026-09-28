import { commonStrings, useStrings } from '../../i18n';
import { AboutSection } from './AboutSection';
import { AppsSection } from './AppsSection';
import styles from './CvScreen.module.css';
import type { CvUiState } from './CvUiState';
import { EducationSection } from './EducationSection';
import { ExperienceSection } from './ExperienceSection';
import { HeaderSection } from './HeaderSection';
import { cvStrings } from './strings';
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
  const strings = useStrings(cvStrings);

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
      <ExperienceSection
        title={strings.latestExperienceTitle}
        entries={cv.latestExperience}
        testId={cvTestIds.latestExperience}
      />
      <AppsSection apps={cv.apps} />
      <EducationSection lines={cv.education} />
      <AboutSection books={cv.books} interests={cv.interests} />
      <ExperienceSection
        title={strings.previousExperienceTitle}
        entries={cv.previousExperience}
        testId={cvTestIds.previousExperience}
        lazy
      />
    </article>
  );
}
