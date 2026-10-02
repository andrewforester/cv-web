import { useStrings } from '../../i18n';
import badge800x600 from './assets/retro_badge_800x600.svg';
import badgeGuestbook from './assets/retro_badge_guestbook.svg';
import underConstruction from './assets/retro_sign_under_construction.svg';
import styles from './Decorations.module.css';
import { retroStrings } from './strings';

/** The 2002 footer: construction sign, hit counter, 88×31 badges, webring and last-updated line. */
export function PageFooter() {
  const strings = useStrings(retroStrings);
  return (
    <div className={styles.footer}>
      <img src={underConstruction} alt="" width={208} height={40} />
      <p>
        {strings.visitorNumber}{' '}
        <span className={styles.counter}>
          {[...strings.counter].map((digit, index) => (
            <span key={index} className={styles.digit}>
              {digit}
            </span>
          ))}
        </span>
      </p>
      <p>
        <img className={styles.badge} src={badge800x600} alt="" width={88} height={31} />
        <img className={styles.badge} src={badgeGuestbook} alt="" width={88} height={31} />
      </p>
      <p>
        [ <span className={styles.fakeLink}>{strings.webringPrev}</span> |{' '}
        <span className={styles.fakeLink}>{strings.webringName}</span> |{' '}
        <span className={styles.fakeLink}>{strings.webringNext}</span> ]
      </p>
      <p>{strings.lastUpdated}</p>
    </div>
  );
}
