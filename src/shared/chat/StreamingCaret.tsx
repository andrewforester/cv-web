import styles from './StreamingCaret.module.css';

/** Blinking bar after the last streamed character (static under reduced motion). */
export function StreamingCaret({ className }: { className?: string }) {
  return (
    <span
      className={className ? `${styles.caret} ${className}` : styles.caret}
      aria-hidden="true"
    />
  );
}
