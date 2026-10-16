import type { ReactNode } from 'react';
import type { CvPageMeta } from '../../data';
import styles from './HomeMetaBar.module.css';
import { homeTestIds } from './testIds';

interface HomeMetaBarProps {
  className?: string;
  /** Absent while the page loads: only the end controls show. */
  meta?: CvPageMeta;
  /** Controls at the end of the status line (the Show case button). */
  end?: ReactNode;
}

/** The mono line on top: location, work mode and availability (the handle is in the toolbar). */
export function HomeMetaBar({ className, meta, end }: HomeMetaBarProps) {
  return (
    <div
      className={className ? `${styles.root} ${className}` : styles.root}
      data-testid={homeTestIds.metaBar}
    >
      <div className={styles.facts}>
        {meta && <span className={styles.item}>{meta.location}</span>}
        {meta && <span className={styles.item}>{meta.workMode}</span>}
        <span className={styles.statusLine}>
          {meta && (
            <span className={styles.status}>
              <span className={styles.dot} aria-hidden="true" />
              {meta.status}
            </span>
          )}
          {end}
        </span>
      </div>
    </div>
  );
}
