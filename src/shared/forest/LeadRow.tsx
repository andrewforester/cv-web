import type { ReactNode } from 'react';
import { classNames } from './classNames';
import type { DataAttributes } from './dataAttributes';
import styles from './LeadRow.module.css';
import { forestTestIds } from './testIds';

interface LeadRowProps {
  className?: string;
  /** The lead paragraph(s), in the reading font. */
  lead: ReactNode;
  /** Beside the lead on wide screens, below it on narrow ones (the contacts). */
  aside?: ReactNode;
  /** On the lead's box, e.g. its page-agent target. */
  leadAttributes?: DataAttributes;
}

/** The row under the hero's accent rule: the lead text and its aside. */
export function LeadRow({ className, lead, aside, leadAttributes }: LeadRowProps) {
  return (
    <div className={classNames(styles.root, className)}>
      <div className={styles.lead} data-testid={forestTestIds.lead} {...leadAttributes}>
        {lead}
      </div>
      {aside && <div className={styles.aside}>{aside}</div>}
    </div>
  );
}
