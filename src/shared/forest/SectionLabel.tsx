import { classNames } from './classNames';
import styles from './SectionLabel.module.css';

interface SectionLabelProps {
  className?: string;
  id?: string;
  /** 1-based position on the page, shown as `01`. */
  index: number;
  title: string;
}

/** A section's Mono heading: `01 — Selected impact`. */
export function SectionLabel({ className, id, index, title }: SectionLabelProps) {
  return (
    <h2 className={classNames(styles.root, className)} id={id}>
      {`${String(index).padStart(2, '0')} — ${title}`}
    </h2>
  );
}
