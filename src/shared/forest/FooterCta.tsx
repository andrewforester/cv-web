import { classNames } from './classNames';
import type { DataAttributes } from './dataAttributes';
import styles from './FooterCta.module.css';
import { GradientText } from './GradientText';
import { forestTestIds } from './testIds';

interface FooterCtaProps {
  className?: string;
  label: string;
  href: string;
  /** Small print on the right, e.g. the ©. */
  note: string;
  attributes?: DataAttributes;
}

/** The page's closing call to action under an accent rule, with a gradient ↗. */
export function FooterCta({ className, label, href, note, attributes }: FooterCtaProps) {
  return (
    <footer className={classNames(styles.root, className)} data-testid={forestTestIds.footer}
      {...attributes}
    >
      <a className={styles.cta} href={href}>
        {label}
        <GradientText variant="cta">
          <span aria-hidden="true"> ↗</span>
        </GradientText>
      </a>
      <small className={styles.note}>{note}</small>
    </footer>
  );
}
