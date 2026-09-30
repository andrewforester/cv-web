import { useStrings } from '../../i18n';
import styles from './Decorations.module.css';
import { retroStrings } from './strings';

/** The bevelled nav bar (not links) and the Comic Sans marquee over the old page. */
export function TopBar() {
  const strings = useStrings(retroStrings);
  const items = [
    strings.navHome,
    strings.navResume,
    strings.navApps,
    strings.navBooks,
    strings.navGuestbook,
    strings.navLinks,
  ];
  return (
    <div className={styles.topBar}>
      <div className={styles.nav}>
        {items.map((item) => (
          <span key={item} className={styles.navItem}>
            {item}
          </span>
        ))}
      </div>
      <div className={styles.marquee}>
        <span className={styles.marqueeText}>{strings.marquee}</span>
      </div>
    </div>
  );
}
