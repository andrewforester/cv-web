import type { ReactNode } from 'react';
import styles from './HomePage.module.css';
import { homeTestIds } from './testIds';

interface HomePageProps {
  className?: string;
  /** The sticky toolbar above the card. */
  toolbar?: ReactNode;
  children: ReactNode;
}

/** The toolbar, then the white page card on the lilac background with the page's blocks, top to bottom. */
export function HomePage({ className, toolbar, children }: HomePageProps) {
  return (
    <div
      className={className ? `${styles.root} ${className}` : styles.root}
      data-testid={homeTestIds.root}
    >
      {toolbar}
      <div className={styles.card}>{children}</div>
    </div>
  );
}
