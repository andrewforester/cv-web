import type { ReactNode } from 'react';
import { classNames } from './classNames';
import styles from './MetaBar.module.css';
import { forestTestIds } from './testIds';

interface MetaBarProps {
  className?: string;
  /** Left end, e.g. `andrew.panasiuk / cv`. */
  handle: string;
  /** Plain facts on the right (location, work mode). */
  facts?: string[];
  /** Availability, shown with the status dot after the facts. */
  status?: string;
  /** Controls at the right end: the language switcher, page actions. */
  end?: ReactNode;
}

/** The thin Mono bar at the top of a Forest page. */
export function MetaBar({ className, handle, facts = [], status, end }: MetaBarProps) {
  return (
    <div className={classNames(styles.root, className)} data-testid={forestTestIds.metaBar}>
      <span className={styles.item}>{handle}</span>
      <div className={styles.right}>
        {facts.map((fact) => (
          <span key={fact} className={styles.item}>
            {fact}
          </span>
        ))}
        {status && (
          <span className={classNames(styles.item, styles.status)}>
            <span className={styles.dot} aria-hidden="true" />
            {status}
          </span>
        )}
        {end}
      </div>
    </div>
  );
}
