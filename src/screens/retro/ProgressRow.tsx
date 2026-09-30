import styles from './LiveConsole.module.css';
import { retroTestIds } from './testIds';
import windowStyles from './Win98Window.module.css';

/** `Step n of N: title`, a Win98 block bar and the percentage. */
export function ProgressRow({ label, percent }: { label: string; percent: number }) {
  return (
    <div className={styles.progress}>
      <span className={styles.label}>{label}</span>
      <span
        className={`${windowStyles.cell} ${styles.bar}`}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        data-testid={retroTestIds.progress}
      >
        <span className={styles.blocks} style={{ width: `${percent}%` }} />
      </span>
      <span className={styles.percent}>{percent}%</span>
    </div>
  );
}
