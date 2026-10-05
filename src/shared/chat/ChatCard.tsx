import type { ComponentProps } from 'react';
import styles from './ChatCard.module.css';

/** The chat's card frame: column, the dark panel; children fill it. */
export function ChatCard({ className, ...rest }: ComponentProps<'section'>) {
  return <section className={className ? `${styles.card} ${className}` : styles.card} {...rest} />;
}
