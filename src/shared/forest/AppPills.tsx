import { AppPill, type AppPillItem } from './AppPill';
import { classNames } from './classNames';
import styles from './AppPills.module.css';

interface AppPillsProps {
  className?: string;
  apps: AppPillItem[];
}

/** A wrapping row of app pills (after the job rows). */
export function AppPills({ className, apps }: AppPillsProps) {
  return (
    <div className={classNames(styles.root, className)}>
      {apps.map((app) => (
        <AppPill key={app.id} app={app} />
      ))}
    </div>
  );
}
