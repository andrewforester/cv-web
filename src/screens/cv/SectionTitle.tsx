import type { ReactNode } from 'react';
import styles from './SectionTitle.module.css';

interface SectionTitleProps {
  className?: string;
  children: ReactNode;
}

/** Title of a CV section ("Summary", "Technologies", …). */
export function SectionTitle({ className, children }: SectionTitleProps) {
  return <h2 className={[styles.title, className].filter(Boolean).join(' ')}>{children}</h2>;
}
