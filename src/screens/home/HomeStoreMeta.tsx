import styles from './HomeStoreMeta.module.css';

interface HomeStoreMetaProps {
  className?: string;
  /** As displayed, e.g. `1M+ · 5.0★ · 91.8K reviews`; the ★ is drawn smaller. */
  text: string;
}

/** A store line (installs, rating, reviews) under an app or a job. */
export function HomeStoreMeta({ className, text }: HomeStoreMetaProps) {
  const [before, ...after] = text.split('★');
  return (
    <div className={className ? `${styles.root} ${className}` : styles.root}>
      <span>{before}</span>
      {after.length > 0 && <span className={styles.star}>★</span>}
      {after.length > 0 && <span className={styles.rest}>{after.join('★')}</span>}
    </div>
  );
}
