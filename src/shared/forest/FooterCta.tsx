import { classNames } from './classNames';
import styles from './FooterCta.module.css';
import { GradientText } from './GradientText';
import { forestTestIds } from './testIds';

interface FooterCtaProps {
  className?: string;
  label: string;
  href: string;
  /** Small print on the right, e.g. the ©. */
  note: string;
}

/** The page's closing call to action under an accent rule, with a gradient ↗. */
export function FooterCta({ className, label, href, note }: FooterCtaProps) {
  return (
    <footer className={classNames(styles.root, className)} data-testid={forestTestIds.footer}>
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
