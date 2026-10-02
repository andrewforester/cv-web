import type { ReactNode } from 'react';
import { commonStrings, useStrings } from '../../i18n';
import { FooterCta } from '../../shared/forest/FooterCta';
import { ForestPage } from '../../shared/forest/ForestPage';
import { ImpactCards } from '../../shared/forest/ImpactCards';
import { LoopPanel } from '../../shared/forest/LoopPanel';
import { Section } from '../../shared/forest/Section';
import { SkillsGrid } from '../../shared/forest/SkillsGrid';
import { ProfileCards } from './ProfileCards';
import { ProfileExperience } from './ProfileExperience';
import { ProfileHeader } from './ProfileHeader';
import styles from './ProfileScreen.module.css';
import type { ProfileUiState } from './ProfileUiState';
import { profileStrings } from './strings';
import { profileTestIds } from './testIds';

interface ProfileScreenProps {
  className?: string;
  state: ProfileUiState;
  /** Controls at the right end of the meta bar (the language switcher). */
  metaBarEnd?: ReactNode;
}

/** The `/new` page in the Forest look: sections 01–06 top to bottom (SPEC → Structure). */
export function ProfileScreen({ className, state, metaBarEnd }: ProfileScreenProps) {
  const common = useStrings(commonStrings);
  const strings = useStrings(profileStrings);

  if (state.status !== 'ready') {
    return (
      <ForestPage className={className} testId={profileTestIds.root}>
        <ProfileHeader metaBarEnd={metaBarEnd} />
        <p className={styles.status} role="status" data-testid={profileTestIds.status}>
          {state.status === 'loading' ? common.loading : common.loadError}
        </p>
      </ForestPage>
    );
  }

  const { profile } = state;
  return (
    <ForestPage className={className} testId={profileTestIds.root}>
      <ProfileHeader profile={profile} metaBarEnd={metaBarEnd} />
      <Section index={1} title={strings.impactTitle} testId={profileTestIds.impact}>
        <ImpactCards items={profile.impact} />
      </Section>
      <Section index={2} title={strings.loopTitle} testId={profileTestIds.loop}>
        <LoopPanel {...profile.loop} />
      </Section>
      <ProfileExperience index={3} profile={profile} />
      <Section index={4} title={strings.skillsTitle} testId={profileTestIds.skills}>
        <SkillsGrid groups={profile.skills} />
      </Section>
      <ProfileCards index={5} profile={profile} />
      <FooterCta {...profile.footer} note={strings.footerNote} />
    </ForestPage>
  );
}
