import type { ReactNode } from 'react';
import { classNames } from './classNames';
import type { DataAttributes } from './dataAttributes';
import styles from './JobRow.module.css';
import { forestTestIds } from './testIds';

interface JobRowProps {
  className?: string;
  company: string;
  role: string;
  period: string;
  /** Bullet points; rich text allowed. */
  points: ReactNode[];
  attributes?: DataAttributes;
}

/** One job: company, role and period on the left, "—" bullets on the right. */
export function JobRow({ className, company, role, period, points, attributes }: JobRowProps) {
  return (
    <article
      className={classNames(styles.root, className)}
      data-testid={forestTestIds.job}
      {...attributes}
    >
      <div className={styles.who}>
        <h3 className={styles.company}>{company}</h3>
        <p className={styles.role}>{role}</p>
        <p className={styles.period}>{period}</p>
      </div>
      <ul className={styles.points}>
        {points.map((point, index) => (
          <li key={index} className={styles.point}>
            <span className={styles.dash} aria-hidden="true">
              —
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
