import { classNames } from './classNames';
import styles from './EarlierRow.module.css';
import { forestTestIds } from './testIds';

export interface EarlierRowItem {
  id: string;
  company: string;
  role: string;
  period: string;
}

interface EarlierRowProps {
  className?: string;
  /** The row's title, e.g. "Earlier". */
  label: string;
  items: EarlierRowItem[];
}

/** Older jobs in one line: `Company — Role (period) · …`, in the job rows' columns. */
export function EarlierRow({ className, label, items }: EarlierRowProps) {
  const text = items.map((item) => `${item.company} — ${item.role} (${item.period})`).join(' · ');
  return (
    <div className={classNames(styles.root, className)} data-testid={forestTestIds.earlier}>
      <h3 className={styles.label}>{label}</h3>
      <p className={styles.text}>{text}</p>
    </div>
  );
}
