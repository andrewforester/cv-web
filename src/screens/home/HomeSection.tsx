import type { ReactNode } from 'react';
import styles from './HomeSection.module.css';

interface HomeSectionProps {
  className?: string;
  title: string;
  /** A mono line under the title (e.g. `system with feedback`). */
  note?: string;
  testId: string;
  /** `data-*` attributes of the section (its agent target). */
  attributes?: Record<string, string | undefined>;
  children: ReactNode;
}

/** A titled block of the page: h2 (and an optional mono note), then its content. */
export function HomeSection({
  className,
  title,
  note,
  testId,
  attributes,
  children,
}: HomeSectionProps) {
  return (
    <section
      className={className ? `${styles.root} ${className}` : styles.root}
      data-testid={testId}
      {...attributes}
    >
      <div className={styles.heading}>
        <h2 className={styles.title}>{title}</h2>
        {note && <span className={styles.note}>{note}</span>}
      </div>
      {children}
    </section>
  );
}
