import type { CvJob } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useStrings } from '../../i18n';
import { agentTargetProps } from '../../shared/agentTarget';
import styles from './HomeExperience.module.css';
import { HomeJob } from './HomeJob';
import { HomeSection } from './HomeSection';
import { homeStrings } from './strings';
import { homeTestIds } from './testIds';

interface HomeExperienceProps {
  jobs: CvJob[];
  highlightedId: AgentTargetId | null;
}

/** "Experience": the jobs, newest first, each between rules. */
export function HomeExperience({ jobs, highlightedId }: HomeExperienceProps) {
  const strings = useStrings(homeStrings);
  return (
    <HomeSection
      title={strings.experienceTitle}
      testId={homeTestIds.experience}
      attributes={agentTargetProps('section', 'experience', highlightedId)}
    >
      <div className={styles.jobs}>
        {jobs.map((job) => (
          <HomeJob key={job.id} job={job} highlightedId={highlightedId} />
        ))}
      </div>
    </HomeSection>
  );
}
