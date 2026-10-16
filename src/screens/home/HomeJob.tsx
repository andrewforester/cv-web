import type { CvJob } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { agentTargetProps } from '../../shared/agentTarget';
import styles from './HomeJob.module.css';
import { HomePoints } from './HomePoints';
import { HomeNameLink } from './HomeNameLink';
import { HomeProjects } from './HomeProjects';
import { HomeStoreMeta } from './HomeStoreMeta';
import { HomeTagLine } from './HomeTagLine';
import { homeImageUrl } from './images';
import { homeTestIds } from './testIds';

interface HomeJobProps {
  job: CvJob;
  highlightedId: AgentTargetId | null;
}

/**
 * One job (agent target `experience:<id>`): logo, company and period, role; then, from the logo's
 * left edge, the tag line and the points; then its client projects, if any.
 */
export function HomeJob({ job, highlightedId }: HomeJobProps) {
  return (
    <article
      className={styles.root}
      data-testid={homeTestIds.job}
      {...agentTargetProps('experience', job.id, highlightedId)}
    >
      <div className={styles.head}>
        <img
          className={job.logoPlain ? styles.logo : `${styles.logo} ${styles.tile}`}
          src={homeImageUrl(job.logo)}
          alt=""
        />
        <div className={styles.info}>
          <div className={styles.titleRow}>
            <HomeNameLink className={styles.company} name={job.company} url={job.url} />
            <div className={styles.period}>{job.period}</div>
          </div>
          <div className={styles.role}>{job.role}</div>
          {job.meta && <HomeStoreMeta className={styles.meta} text={job.meta} />}
        </div>
      </div>
      {job.about && <HomeTagLine tags={job.tags ?? []} text={job.about} />}
      {job.points.length > 0 && <HomePoints points={job.points} />}
      {job.projects && <HomeProjects projects={job.projects} highlightedId={highlightedId} />}
    </article>
  );
}
