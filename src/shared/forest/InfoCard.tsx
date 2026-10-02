import { useId, type ReactNode } from 'react';
import { classNames } from './classNames';
import type { DataAttributes } from './dataAttributes';
import styles from './InfoCard.module.css';
import { SectionLabel } from './SectionLabel';

interface InfoCardProps {
  className?: string;
  /** `sage` (education) or `sand` (about me). */
  tone: 'sage' | 'sand';
  index: number;
  title: string;
  /** Card title under the label, e.g. the degree. */
  heading?: string;
  /** A line under the heading, e.g. `University · 2007–2012`. */
  meta?: string;
  /** Pictures above the text, e.g. book covers. */
  media?: ReactNode;
  /** The card's reading text; several children become separate lines. */
  children?: ReactNode;
  testId?: string;
  attributes?: DataAttributes;
}

/** A tinted, numbered card section (education, about me); cards sit side by side in a grid. */
export function InfoCard({
  className,
  tone,
  index,
  title,
  heading,
  meta,
  media,
  children,
  testId,
  attributes,
}: InfoCardProps) {
  const labelId = useId();
  return (
    <section
      className={classNames(styles.root, styles[tone], className)}
      aria-labelledby={labelId}
      data-testid={testId}
      {...attributes}
    >
      <SectionLabel id={labelId} index={index} title={title} />
      {heading && <h3 className={styles.heading}>{heading}</h3>}
      {meta && <p className={styles.meta}>{meta}</p>}
      {media && <div className={styles.media}>{media}</div>}
      {children && <div className={styles.text}>{children}</div>}
    </section>
  );
}
