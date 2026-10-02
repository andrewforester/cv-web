import { Fragment } from 'react';
import { classNames } from './classNames';
import type { DataAttributes } from './dataAttributes';
import styles from './EarlierRow.module.css';
import { forestTestIds } from './testIds';

export interface EarlierRowItem {
  id: string;
  company: string;
  role: string;
  period: string;
  attributes?: DataAttributes;
}

interface EarlierRowProps {
  className?: string;
  /** The row's title, e.g. "Earlier". */
  label: string;
  items: EarlierRowItem[];
}

/** Older jobs in one line: `Company — Role (period) · …`, in the job rows' columns. */
export function EarlierRow({ className, label, items }: EarlierRowProps) {
  return (
    <div className={classNames(styles.root, className)} data-testid={forestTestIds.earlier}>
      <h3 className={styles.label}>{label}</h3>
      <p className={styles.text}>
        {items.map((item, index) => (
          <Fragment key={item.id}>
            {index > 0 && ' · '}
            <span {...item.attributes}>{`${item.company} — ${item.role} (${item.period})`}</span>
          </Fragment>
        ))}
      </p>
    </div>
  );
}
