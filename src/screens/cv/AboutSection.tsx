import type { Book } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useStrings } from '../../i18n';
import { agentTargetProps } from './agentTarget';
import styles from './AboutSection.module.css';
import { BookView } from './BookView';
import { SectionTitle } from './SectionTitle';
import { cvStrings } from './strings';
import { cvTestIds } from './testIds';

interface AboutSectionProps {
  className?: string;
  books: Book[];
  interests: string;
  highlightedId: AgentTargetId | null;
}

/** "About me": favourite books (covers with title and author), then interests. */
export function AboutSection({ className, books, interests, highlightedId }: AboutSectionProps) {
  const strings = useStrings(cvStrings);

  return (
    <section className={className} {...agentTargetProps('section', 'about', highlightedId)}>
      <SectionTitle>{strings.aboutTitle}</SectionTitle>
      <h3 className={styles.subtitle}>{strings.favouriteBooksTitle}</h3>
      <ul className={styles.books}>
        {books.map((book) => (
          <li key={book.id}>
            <BookView book={book} highlightedId={highlightedId} />
          </li>
        ))}
      </ul>
      <h3 className={`${styles.subtitle} ${styles.interestsTitle}`}>{strings.interestsTitle}</h3>
      <p className={styles.interests} data-testid={cvTestIds.interests}>
        {interests}
      </p>
    </section>
  );
}
