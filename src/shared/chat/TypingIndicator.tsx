import styles from './TypingIndicator.module.css';
import { sharedChatTestIds } from './testIds';

/** Three pulsing dots while waiting for the first token (the live region says "typing"). */
export function TypingIndicator({ className }: { className?: string }) {
  return (
    <span
      className={className ? `${styles.typing} ${className}` : styles.typing}
      aria-hidden="true"
      data-testid={sharedChatTestIds.typing}
    >
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </span>
  );
}
