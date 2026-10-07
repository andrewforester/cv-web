import styles from './VoiceFog.module.css';

/** The veil over the page, the fog rising from the bottom edge and its lit edge (decorative). */
export function VoiceFog({ className }: { className?: string }) {
  return (
    <div className={className ? `${styles.fog} ${className}` : styles.fog} aria-hidden="true">
      <div className={styles.veil} />
      <div className={styles.band}>
        <div className={`${styles.blob} ${styles.a}`} />
        <div className={`${styles.blob} ${styles.b}`} />
        <div className={`${styles.blob} ${styles.c}`} />
        <div className={`${styles.blob} ${styles.d}`} />
      </div>
      <div className={styles.edge} />
    </div>
  );
}
