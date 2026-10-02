import type { ReactNode } from 'react';
import { classNames } from './classNames';
import type { DataAttributes } from './dataAttributes';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  className?: string;
  /** The meta bar, the hero and the lead row, top to bottom. */
  children: ReactNode;
  testId?: string;
  attributes?: DataAttributes;
}

/** The top of a Forest page: stacks the meta bar, hero and lead row with the header gap. */
export function PageHeader({ className, children, testId, attributes }: PageHeaderProps) {
  return (
    <header className={classNames(styles.root, className)} data-testid={testId} {...attributes}>
      {children}
    </header>
  );
}
