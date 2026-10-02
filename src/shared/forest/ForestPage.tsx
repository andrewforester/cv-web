import type { ReactNode } from 'react';
import { classNames } from './classNames';
import styles from './ForestPage.module.css';

interface ForestPageProps {
  className?: string;
  children: ReactNode;
  testId?: string;
}

/** The Forest page column: 1080 px centred, Forest base type, the gap between sections. */
export function ForestPage({ className, children, testId }: ForestPageProps) {
  return (
    <article className={classNames(styles.root, className)} data-testid={testId}>
      {children}
    </article>
  );
}
