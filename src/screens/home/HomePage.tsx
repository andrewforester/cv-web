import type { ReactNode, Ref } from 'react';
import styles from './HomePage.module.css';
import { homeTestIds } from './testIds';

interface HomePageProps {
  className?: string;
  children: ReactNode;
  /** The page's root element (the motion runs inside it). */
  rootRef?: Ref<HTMLDivElement>;
}

/** The white page card on the lilac background; its children are the page's blocks, top to bottom. */
export function HomePage({ className, children, rootRef }: HomePageProps) {
  return (
    <div
      ref={rootRef}
      className={className ? `${styles.root} ${className}` : styles.root}
      data-testid={homeTestIds.root}
    >
      <div className={styles.card}>{children}</div>
    </div>
  );
}
