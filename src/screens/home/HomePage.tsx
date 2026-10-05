import type { ReactNode } from 'react';
import styles from './HomePage.module.css';
import { homeTestIds } from './testIds';

interface HomePageProps {
  className?: string;
  children: ReactNode;
}

/** The white page card on the lilac background; its children are the page's blocks, top to bottom. */
export function HomePage({ className, children }: HomePageProps) {
  return (
    <div
      className={className ? `${styles.root} ${className}` : styles.root}
      data-testid={homeTestIds.root}
    >
      <div className={styles.card}>{children}</div>
    </div>
  );
}
