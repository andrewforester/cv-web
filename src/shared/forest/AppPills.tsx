import { AppPill, type AppPillItem } from './AppPill';
import { classNames } from './classNames';
import type { DataAttributes } from './dataAttributes';
import styles from './AppPills.module.css';

interface AppPillsProps {
  className?: string;
  apps: AppPillItem[];
  testId?: string;
  attributes?: DataAttributes;
}

/** A wrapping row of app pills (after the job rows). */
export function AppPills({ className, apps, testId, attributes }: AppPillsProps) {
  return (
    <div className={classNames(styles.root, className)} data-testid={testId} {...attributes}>
      {apps.map((app) => (
        <AppPill key={app.id} app={app} />
      ))}
    </div>
  );
}
