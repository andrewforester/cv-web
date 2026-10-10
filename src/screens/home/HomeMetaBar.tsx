import type { ReactNode } from 'react';
import type { CvPageMeta } from '../../data';
import { useStrings } from '../../i18n';
import styles from './HomeMetaBar.module.css';
import { homeStrings } from './strings';
import { homeTestIds } from './testIds';

interface HomeMetaBarProps {
  /** Absent while the page loads: only the handle and the end controls show. */
  meta?: CvPageMeta;
  /** Controls at the end of the status line (the Show case button). */
  end?: ReactNode;
}

/** The mono line on top: the handle, then location, work mode and availability. */
export function HomeMetaBar({ meta, end }: HomeMetaBarProps) {
  const strings = useStrings(homeStrings);
  return (
    <nav className={styles.root} data-testid={homeTestIds.metaBar}>
      <span className={styles.item}>{strings.handle}</span>
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
    </nav>
  );
}
