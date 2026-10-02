import type { AppCard, Cv, ExperienceEntry } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useStrings } from '../../i18n';
import { AppPills } from '../../shared/forest/AppPills';
import { JobRow } from '../../shared/forest/JobRow';
import { Section } from '../../shared/forest/Section';
import { agentTargetProps } from '../../shared/agentTarget';
import styles from './CvExperience.module.css';
import { cvImageUrl } from './images';
import { RichTextSpans } from './RichTextSpans';
import { cvStrings } from './strings';
import { cvTestIds } from './testIds';

interface CvExperienceProps {
  className?: string;
  index: number;
  cv: Pick<Cv, 'latestExperience' | 'previousExperience' | 'apps'>;
  highlightedId: AgentTargetId | null;
}

/** Store stats in one Mono line: `5.0★ · 91.8K · 1M+`, leaving out what the app doesn't show. */
function appMeta(app: AppCard): string {
  return [app.rating && `${app.rating}★`, app.reviews, app.downloads].filter(Boolean).join(' · ');
}

/**
 * Experience: the latest and the previous jobs as job rows, then the app pills. Each group is
 * its own page-agent section, as the separate sections were before.
 */
export function CvExperience({ className, index, cv, highlightedId }: CvExperienceProps) {
  const strings = useStrings(cvStrings);

  const jobs = (entries: ExperienceEntry[]) =>
    entries.map((entry) => (
      <JobRow
        key={entry.id}
        company={entry.company}
        role={entry.remote ? `${entry.role} · ${strings.remotely}` : entry.role}
        period={entry.period}
        points={entry.bullets.map((bullet, bulletIndex) => (
          <RichTextSpans key={bulletIndex} text={bullet} />
        ))}
        attributes={agentTargetProps('experience', entry.id, highlightedId)}
      />
    ));

  return (
    <Section
      className={className}
      index={index}
      title={strings.experienceTitle}
      variant="rows"
      testId={cvTestIds.experience}
    >
      <div
        className={styles.rows}
        role="group"
        aria-label={strings.latestExperienceLabel}
        data-testid={cvTestIds.latestExperience}
        {...agentTargetProps('section', 'latest-experience', highlightedId)}
      >
        {jobs(cv.latestExperience)}
      </div>
      <div
        className={styles.rows}
        role="group"
        aria-label={strings.previousExperienceLabel}
        data-testid={cvTestIds.previousExperience}
        {...agentTargetProps('section', 'previous-experience', highlightedId)}
      >
        {jobs(cv.previousExperience)}
      </div>
      <AppPills
        testId={cvTestIds.apps}
        attributes={agentTargetProps('section', 'apps', highlightedId)}
        apps={cv.apps.map((app) => ({
          id: app.id,
          name: app.name,
          iconSrc: cvImageUrl(app.icon),
          meta: appMeta(app),
          attributes: agentTargetProps('app', app.id, highlightedId),
        }))}
      />
    </Section>
  );
}
