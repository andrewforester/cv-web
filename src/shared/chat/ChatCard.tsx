import type { ComponentProps } from 'react';
import styles from './ChatCard.module.css';

/** The chat's card frame: the dark panel, its children stacked top to bottom. */
export function ChatCard({ className, ...rest }: ComponentProps<'section'>) {
  return <section className={className ? `${styles.card} ${className}` : styles.card} {...rest} />;
}
