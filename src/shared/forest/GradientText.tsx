import type { ReactNode } from 'react';
import { classNames } from './classNames';
import styles from './GradientText.module.css';

interface GradientTextProps {
  className?: string;
  /** `text`: green → gold (headline accents); `cta`: the footer arrow's green → gold. */
  variant?: 'text' | 'cta';
  children: ReactNode;
}

/** Text filled with a Forest gradient. */
export function GradientText({ className, variant = 'text', children }: GradientTextProps) {
  return <span className={classNames(styles.root, styles[variant], className)}>{children}</span>;
}
