import type { CvAbout } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useStrings } from '../../i18n';
import { agentTargetProps } from '../../shared/agentTarget';
import styles from './HomeCard.module.css';
import { homeImageUrl } from './images';
import { homeStrings } from './strings';
import { homeTestIds } from './testIds';

interface HomeAboutProps {
  about: CvAbout;
  highlightedId: AgentTargetId | null;
}

/** The "about me" card: book covers (agent targets `book:<id>`), then reading and off-screen lines. */
export function HomeAbout({ about, highlightedId }: HomeAboutProps) {
  const strings = useStrings(homeStrings);
  return (
    <section
      className={`${styles.root} ${styles.neutral}`}
      data-testid={homeTestIds.about}
      {...agentTargetProps('section', 'about', highlightedId)}
    >
      <span className={styles.label}>{strings.aboutLabel}</span>
      <div className={styles.books}>
        {about.books.map((book) => (
          <img
            key={book.id}
            className={styles.book}
            src={homeImageUrl(book.cover)}
            alt={book.title}
            data-testid={homeTestIds.book}
            {...agentTargetProps('book', book.id, highlightedId)}
          />
        ))}
      </div>
      <div className={styles.lines}>
        {about.lines.map((line) => (
          <p key={line.label} className={styles.text}>
            <span className={styles.lineLabel}>{line.label}</span>{' '}
            <span className={styles.secondary}>{line.text}</span>
          </p>
        ))}
      </div>
    </section>
  );
}
