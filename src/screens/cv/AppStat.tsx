import type { ReactNode } from 'react';
import styles from './AppStat.module.css';

interface AppStatProps {
  className?: string;
  value: ReactNode;
  label?: string;
  testId?: string;
}

/** One stat of an app card: a value centred over its label ("1M+" / "Downloads"). */
export function AppStat({ className, value, label, testId }: AppStatProps) {
  return (
    <div className={[styles.stat, className].filter(Boolean).join(' ')} data-testid={testId}>
      <p className={styles.value}>{value}</p>
      {label && <p className={styles.label}>{label}</p>}
    </div>
  );
}
