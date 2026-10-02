import type { Profile } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { agentTargetProps } from '../../shared/agentTarget';
import { useStrings } from '../../i18n';
import { AppPills } from '../../shared/forest/AppPills';
import { EarlierRow } from '../../shared/forest/EarlierRow';
import { JobRow } from '../../shared/forest/JobRow';
import { Section } from '../../shared/forest/Section';
import { profileImageUrl } from './images';
import { profileStrings } from './strings';
import { profileTestIds } from './testIds';

interface ProfileExperienceProps {
  className?: string;
  index: number;
  profile: Pick<Profile, 'jobs' | 'earlier' | 'apps'>;
  highlightedId: AgentTargetId | null;
}

/** Experience: the job rows, the "Earlier" row and the app pills (the agent's `apps` section). */
export function ProfileExperience({
  className,
  index,
  profile,
  highlightedId,
}: ProfileExperienceProps) {
  const target = (kind: 'experience' | 'app', id: string) =>
    agentTargetProps(kind, id, highlightedId);
  const strings = useStrings(profileStrings);
  return (
    <Section
      className={className}
      index={index}
      title={strings.experienceTitle}
      variant="rows"
      testId={profileTestIds.experience}
      attributes={agentTargetProps('section', 'experience', highlightedId)}
    >
      {profile.jobs.map((job) => (
        <JobRow
          key={job.id}
          company={job.company}
          role={job.role}
          period={job.period}
          points={job.points}
          attributes={target('experience', job.id)}
        />
      ))}
      {profile.earlier.length > 0 && (
        <EarlierRow
          label={strings.earlierTitle}
          items={profile.earlier.map((job) => ({
            ...job,
            attributes: target('experience', job.id),
          }))}
        />
      )}
      <AppPills
        attributes={agentTargetProps('section', 'apps', highlightedId)}
        apps={profile.apps.map((app) => ({
          ...app,
          iconSrc: profileImageUrl(app.icon),
          attributes: target('app', app.id),
        }))}
      />
    </Section>
  );
}
