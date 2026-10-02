import { classNames } from './classNames';
import type { DataAttributes } from './dataAttributes';
import styles from './ContactRows.module.css';
import { forestTestIds } from './testIds';

export interface ContactRowItem {
  id: string;
  label: string;
  href: string;
  /** Opens in a new tab (messenger links). */
  external?: boolean;
  attributes?: DataAttributes;
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
          <a
            className={styles.row}
            href={item.href}
            target={item.external ? '_blank' : undefined}
            rel={item.external ? 'noreferrer' : undefined}
            data-testid={forestTestIds.contact}
            {...item.attributes}
          >
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
