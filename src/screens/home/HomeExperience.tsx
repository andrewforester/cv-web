import type { CvJob } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { agentTargetProps } from '../../shared/agentTarget';
import styles from './HomeExperience.module.css';
import { HomeJob } from './HomeJob';
import { HomeSection } from './HomeSection';

interface HomeExperienceProps {
  /** `projects` (personal products) or `experience` (jobs). */
  sectionId: 'projects' | 'experience';
  title: string;
  testId: string;
  jobs: CvJob[];
  highlightedId: AgentTargetId | null;
}

/** "Projects" or "Experience": job-shaped entries, newest first, each between rules. */
export function HomeExperience({
  sectionId,
  title,
  testId,
  jobs,
  highlightedId,
}: HomeExperienceProps) {
  return (
    <HomeSection
      title={title}
      testId={testId}
      attributes={agentTargetProps('section', sectionId, highlightedId)}
    >
      <div className={styles.jobs}>
        {jobs.map((job) => (
          <HomeJob key={job.id} job={job} highlightedId={highlightedId} />
        ))}
      </div>
    </HomeSection>
  );
}
