import { classNames } from './classNames';
import type { DataAttributes } from './dataAttributes';
import styles from './AppPill.module.css';
import { forestTestIds } from './testIds';

export interface AppPillItem {
  id: string;
  name: string;
  iconSrc: string;
  /** Mono stats, e.g. `5.0★ · 91.8K · 1M+`. */
  meta: string;
  attributes?: DataAttributes;
}

interface AppPillProps {
  className?: string;
  app: AppPillItem;
}

/** An app as a rounded pill: icon, name, stats. */
export function AppPill({ className, app }: AppPillProps) {
  return (
    <div
      className={classNames(styles.root, className)}
      data-testid={forestTestIds.app}
      {...app.attributes}
    >
      <img className={styles.icon} src={app.iconSrc} alt="" />
      <span className={styles.name}>{app.name}</span>
      <span className={styles.meta}>{app.meta}</span>
    </div>
  );
}
