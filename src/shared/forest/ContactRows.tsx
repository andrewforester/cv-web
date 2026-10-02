import { classNames } from './classNames';
import styles from './ContactRows.module.css';
import { forestTestIds } from './testIds';

export interface ContactRowItem {
  id: string;
  label: string;
  href: string;
}

interface ContactRowsProps {
  className?: string;
  items: ContactRowItem[];
  /** Accessible name of the list, e.g. "Contacts". */
  label?: string;
}

/** Contact links, one per row with a hairline below and an accent ↗. */
export function ContactRows({ className, items, label }: ContactRowsProps) {
  return (
    <ul className={classNames(styles.root, className)} aria-label={label}>
      {items.map((item) => (
        <li key={item.id}>
          <a className={styles.row} href={item.href} data-testid={forestTestIds.contact}>
            <span className={styles.label}>{item.label}</span>
            <span className={styles.arrow} aria-hidden="true">
              ↗
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
