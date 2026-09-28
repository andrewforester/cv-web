import type { ReactNode } from 'react';
import styles from './ExperienceList.module.css';

interface ExperienceListProps {
  className?: string;
  children: ReactNode;
}

/** Stack of `ExperienceEntry`s, 30 px apart. */
export function ExperienceList({ className, children }: ExperienceListProps) {
  return <div className={[styles.list, className].filter(Boolean).join(' ')}>{children}</div>;
}
