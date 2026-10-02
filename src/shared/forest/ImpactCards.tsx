import { classNames } from './classNames';
import type { DataAttributes } from './dataAttributes';
import styles from './ImpactCards.module.css';
import { forestTestIds } from './testIds';

export interface ImpactCardItem {
  id: string;
  /** The big figure, e.g. `1 day`. */
  value: string;
  text: string;
  attributes?: DataAttributes;
}

interface ImpactCardsProps {
  className?: string;
  items: ImpactCardItem[];
}

/** Figure cards in an auto-fit grid; the first one is featured on the dark green gradient. */
export function ImpactCards({ className, items }: ImpactCardsProps) {
  return (
    <ul className={classNames(styles.root, className)}>
      {items.map((item, index) => (
        <li
          key={item.id}
          className={classNames(styles.card, index === 0 && styles.featured)}
          data-testid={forestTestIds.impactCard}
          {...item.attributes}
        >
          <span className={styles.value}>{item.value}</span>
          <span className={styles.text}>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}
