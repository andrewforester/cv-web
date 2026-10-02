import { classNames } from './classNames';
import styles from './PageStatus.module.css';

interface PageStatusProps {
  className?: string;
  /** E.g. "Loading…" or the load error. */
  text: string;
  testId?: string;
}

/** The line a page shows instead of its sections while loading or after an error. */
export function PageStatus({ className, text, testId }: PageStatusProps) {
  return (
    <p className={classNames(styles.root, className)} role="status" data-testid={testId}>
      {text}
    </p>
  );
}
