import type { Profile } from '../../data';
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
}

/** Experience: the job rows, the "Earlier" row and the app pills. */
export function ProfileExperience({ className, index, profile }: ProfileExperienceProps) {
  const strings = useStrings(profileStrings);
  return (
    <Section
      className={className}
      index={index}
      title={strings.experienceTitle}
      variant="rows"
      testId={profileTestIds.experience}
    >
      {profile.jobs.map((job) => (
        <JobRow
          key={job.id}
          company={job.company}
          role={job.role}
          period={job.period}
          points={job.points}
        />
      ))}
      {profile.earlier.length > 0 && (
        <EarlierRow label={strings.earlierTitle} items={profile.earlier} />
      )}
      <AppPills
        apps={profile.apps.map((app) => ({ ...app, iconSrc: profileImageUrl(app.icon) }))}
      />
    </Section>
  );
}
