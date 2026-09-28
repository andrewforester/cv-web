import type { Book } from '../../data';
import styles from './BookView.module.css';
import { cvImageUrl } from './images';
import { cvTestIds } from './testIds';

interface BookViewProps {
  className?: string;
  book: Book;
}

/** A book: cover with a shadow, then title and author. */
export function BookView({ className, book }: BookViewProps) {
  return (
    <figure
      className={[styles.book, className].filter(Boolean).join(' ')}
      data-testid={cvTestIds.book}
    >
      <img className={styles.cover} src={cvImageUrl(book.cover)} alt={book.title} loading="lazy" />
      <figcaption className={styles.caption}>
        <span className={styles.title}>{book.title}</span>
        <span className={styles.author}>{book.author}</span>
      </figcaption>
    </figure>
  );
}
