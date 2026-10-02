import type { ReactNode } from 'react';
import { classNames } from './classNames';
import styles from './InfoCards.module.css';

interface InfoCardsProps {
  className?: string;
  children: ReactNode;
}

/** Lays `InfoCard`s side by side, stacking them on narrow screens. */
export function InfoCards({ className, children }: InfoCardsProps) {
  return <div className={classNames(styles.root, className)}>{children}</div>;
}
