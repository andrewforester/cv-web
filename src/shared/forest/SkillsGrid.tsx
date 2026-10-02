import type { ReactNode } from 'react';
import { classNames } from './classNames';
import type { DataAttributes } from './dataAttributes';
import { GradientText } from './GradientText';
import styles from './SkillsGrid.module.css';
import { forestTestIds } from './testIds';

export interface SkillsGridItem {
  id: string;
  title: string;
  /** As displayed, usually comma-separated. */
  items: ReactNode;
  /** Sets the title apart: in the accent colour or the text gradient. */
  emphasis?: 'accent' | 'gradient';
  attributes?: DataAttributes;
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
        <li
          key={group.id}
          className={styles.group}
          data-testid={forestTestIds.skill}
          {...group.attributes}
        >
          <h3 className={classNames(styles.title, group.emphasis === 'accent' && styles.accent)}>
            {group.emphasis === 'gradient' ? (
              <GradientText>{group.title}</GradientText>
            ) : (
              group.title
            )}
          </h3>
          <p className={styles.items}>{group.items}</p>
        </li>
      ))}
    </ul>
  );
}
