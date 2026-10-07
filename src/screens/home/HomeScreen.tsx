import type { ReactNode } from 'react';
import { commonStrings, useStrings } from '../../i18n';
import { HomeAbout } from './HomeAbout';
import { HomeCraft } from './HomeCraft';
import { HomeEducation } from './HomeEducation';
import { HomeExperience } from './HomeExperience';
import { HomeFooter } from './HomeFooter';
import { HomeImpact } from './HomeImpact';
import { HomeLoop } from './HomeLoop';
import { HomePage } from './HomePage';
import styles from './HomeScreen.module.css';
import { HomeSkills } from './HomeSkills';
import { HomeTop } from './HomeTop';
import type { HomeUiState } from './HomeUiState';
import { homeStrings } from './strings';
import { homeTestIds } from './testIds';

interface HomeScreenProps {
  className?: string;
  state: HomeUiState;
  /** Controls at the end of the meta bar (the Show case button). */
  metaBarEnd?: ReactNode;
  /** Control after the copyright line (the Show case link). */
  copyrightEnd?: ReactNode;
}

/** The one CV page, top to bottom as in docs/design/v3 (SPEC → Structure). */
export function HomeScreen({ className, state, metaBarEnd, copyrightEnd }: HomeScreenProps) {
  const common = useStrings(commonStrings);
  const strings = useStrings(homeStrings);

  if (state.status !== 'ready') {
    return (
      <HomePage className={className}>
        <HomeTop metaBarEnd={metaBarEnd} highlightedId={null} />
        <p className={styles.status} data-testid={homeTestIds.status}>
          {state.status === 'loading' ? common.loading : common.loadError}
        </p>
      </HomePage>
    );
  }

  const { page, highlightedId } = state;
  return (
    <HomePage className={className}>
      <HomeTop page={page} metaBarEnd={metaBarEnd} highlightedId={highlightedId} />
      <HomeSkills skills={page.skills} highlightedId={highlightedId} />
      <HomeCraft craft={page.craft} highlightedId={highlightedId} />
      <HomeLoop loop={page.loop} highlightedId={highlightedId} />
      <HomeImpact impact={page.impact} highlightedId={highlightedId} />
      <HomeExperience jobs={page.jobs} highlightedId={highlightedId} />
      <div className={styles.cards}>
        <HomeEducation education={page.education} highlightedId={highlightedId} />
        <HomeAbout about={page.about} highlightedId={highlightedId} />
      </div>
      <HomeFooter footer={page.footer} contacts={page.contacts} highlightedId={highlightedId} />
      <div className={styles.copyright}>
        <span data-testid={homeTestIds.copyright}>{strings.copyright}</span>
        {copyrightEnd}
      </div>
    </HomePage>
  );
}
