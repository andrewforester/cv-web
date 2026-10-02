import { useId, type ReactNode } from 'react';
import { classNames } from './classNames';
import type { DataAttributes } from './dataAttributes';
import styles from './Section.module.css';
import { SectionLabel } from './SectionLabel';

interface SectionProps {
  className?: string;
  index: number;
  title: string;
  /** `rows`: hairline rows follow the label closely (experience, skills). */
  variant?: 'blocks' | 'rows';
  testId?: string;
  attributes?: DataAttributes;
  children: ReactNode;
}

/** A numbered page section: its label, then the content. */
export function Section({
  className,
  index,
  title,
  variant = 'blocks',
  testId,
  attributes,
  children,
}: SectionProps) {
  const labelId = useId();
  return (
    <section
      className={classNames(styles.root, styles[variant], className)}
      aria-labelledby={labelId}
      data-testid={testId}
      {...attributes}
    >
      <SectionLabel id={labelId} index={index} title={title} />
      {children}
    </section>
  );
}
