import { classNames } from './classNames';
import type { DataAttributes } from './dataAttributes';
import styles from './BookCovers.module.css';
import { forestTestIds } from './testIds';

export interface BookCoverItem {
  id: string;
  title: string;
  coverSrc: string;
  attributes?: DataAttributes;
}

interface BookCoversProps {
  className?: string;
  books: BookCoverItem[];
}

/** A row of small 2:3 book covers. */
export function BookCovers({ className, books }: BookCoversProps) {
  return (
    <ul className={classNames(styles.root, className)}>
      {books.map((book) => (
        <li key={book.id} data-testid={forestTestIds.book} {...book.attributes}>
          <img className={styles.cover} src={book.coverSrc} alt={book.title} />
        </li>
      ))}
    </ul>
  );
}
