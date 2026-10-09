import type { CvProject } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { agentTargetProps } from '../../shared/agentTarget';
import { HomePoints } from './HomePoints';
import styles from './HomeProjects.module.css';
import { HomeStoreMeta } from './HomeStoreMeta';
import { HomeTagLine } from './HomeTagLine';
import { homeImageUrl } from './images';
import { homeTestIds } from './testIds';
import { motionTarget } from './motion/motionTargets';

interface HomeProjectsProps {
  projects: CvProject[];
  highlightedId: AgentTargetId | null;
}

/**
 * A job's client projects on a dotted tree from the job's logo (agent targets `app:<id>`), each laid
 * out like a job: icon, name and store line; the domain tag line; the points.
 */
export function HomeProjects({ projects, highlightedId }: HomeProjectsProps) {
  return (
    <div className={styles.root}>
      {projects.map((project) => (
        <div
          key={project.id}
          className={styles.project}
          data-testid={homeTestIds.project}
          {...agentTargetProps('app', project.id, highlightedId)}
          {...motionTarget('project')}
        >
          <span className={styles.stem} aria-hidden="true" {...motionTarget('stem')} />
          <span className={styles.branch} aria-hidden="true" {...motionTarget('branch')} />
          <div className={styles.body} {...motionTarget('project-body')}>
            <div className={styles.head}>
              {project.icon ? (
                <img className={styles.icon} src={homeImageUrl(project.icon)} alt="" />
              ) : (
                <span className={`${styles.icon} ${styles.initials}`} aria-hidden="true">
                  {project.name.charAt(0)}
                </span>
              )}
              <div className={styles.names}>
                <div className={styles.name}>{project.name}</div>
                <HomeStoreMeta text={project.meta} />
              </div>
            </div>
            <HomeTagLine tag={project.domain} text={project.about} />
            <HomePoints points={project.points} />
          </div>
        </div>
      ))}
    </div>
  );
}
