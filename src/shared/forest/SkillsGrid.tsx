import type { ReactNode } from 'react';
import { classNames } from './classNames';
import styles from './SkillsGrid.module.css';
import { forestTestIds } from './testIds';

export interface SkillsGridItem {
  id: string;
  title: string;
  /** As displayed, usually comma-separated. */
  items: ReactNode;
}

interface SkillsGridProps {
  className?: string;
  groups: SkillsGridItem[];
}

/** Skill groups in a 2–3 column grid: a title and its items, a hairline above each. */
export function SkillsGrid({ className, groups }: SkillsGridProps) {
  return (
    <ul className={classNames(styles.root, className)}>
      {groups.map((group) => (
        <li key={group.id} className={styles.group} data-testid={forestTestIds.skill}>
          <h3 className={styles.title}>{group.title}</h3>
          <p className={styles.items}>{group.items}</p>
        </li>
      ))}
    </ul>
  );
}
