import styles from './Decorations.module.css';

interface TopBarProps {
  /** The page's nav items (not links). */
  nav: string[];
  marquee: string;
}

/** The bevelled nav bar (not links) and the Comic Sans marquee over the old page. */
export function TopBar({ nav, marquee }: TopBarProps) {
  return (
    <div className={styles.topBar}>
      <div className={styles.nav}>
        {nav.map((item) => (
          <span key={item} className={styles.navItem}>
            {item}
          </span>
        ))}
      </div>
      <div className={styles.marquee}>
        <span className={styles.marqueeText}>{marquee}</span>
      </div>
    </div>
  );
}
