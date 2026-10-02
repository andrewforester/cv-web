import type { ReactNode } from 'react';
import { commonStrings, useStrings } from '../../i18n';
import { agentTargetProps } from '../../shared/agentTarget';
import { FooterCta } from '../../shared/forest/FooterCta';
import { ForestPage } from '../../shared/forest/ForestPage';
import { PageStatus } from '../../shared/forest/PageStatus';
import { LoopPanel } from '../../shared/forest/LoopPanel';
import { Section } from '../../shared/forest/Section';
import { ProfileCards } from './ProfileCards';
import { ProfileExperience } from './ProfileExperience';
import { ProfileHeader } from './ProfileHeader';
import { ProfileImpact } from './ProfileImpact';
import { ProfileSkills } from './ProfileSkills';
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
        <PageStatus
          text={state.status === 'loading' ? common.loading : common.loadError}
          testId={profileTestIds.status}
        />
      </ForestPage>
    );
  }

  const { profile, highlightedId } = state;
  return (
    <ForestPage className={className} testId={profileTestIds.root}>
      <ProfileHeader profile={profile} metaBarEnd={metaBarEnd} highlightedId={highlightedId} />
      <ProfileImpact index={1} impact={profile.impact} highlightedId={highlightedId} />
      <Section
        index={2}
        title={strings.loopTitle}
        testId={profileTestIds.loop}
        attributes={agentTargetProps('section', 'loop', highlightedId)}
      >
        <LoopPanel {...profile.loop} />
      </Section>
      <ProfileExperience index={3} profile={profile} highlightedId={highlightedId} />
      <ProfileSkills index={4} skills={profile.skills} highlightedId={highlightedId} />
      <ProfileCards index={5} profile={profile} highlightedId={highlightedId} />
      <FooterCta
        {...profile.footer}
        note={strings.footerNote}
        attributes={agentTargetProps('section', 'footer', highlightedId)}
      />
    </ForestPage>
  );
}
