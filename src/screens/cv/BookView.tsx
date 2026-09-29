import type { Book } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { agentTargetProps } from './agentTarget';
import styles from './BookView.module.css';
import { cvImageUrl } from './images';
import { cvTestIds } from './testIds';

interface BookViewProps {
  className?: string;
  book: Book;
  highlightedId: AgentTargetId | null;
}

/** A book: cover with a shadow, then title and author. */
export function BookView({ className, book, highlightedId }: BookViewProps) {
  return (
    <figure
      className={[styles.book, className].filter(Boolean).join(' ')}
      data-testid={cvTestIds.book}
      {...agentTargetProps('book', book.id, highlightedId)}
    >
      <img className={styles.cover} src={cvImageUrl(book.cover)} alt={book.title} loading="lazy" />
      <figcaption className={styles.caption}>
        <span className={styles.title}>{book.title}</span>
        <span className={styles.author}>{book.author}</span>
      </figcaption>
    </figure>
  );
}
