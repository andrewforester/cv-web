import { useStrings } from '../../i18n';
import styles from './EducationSection.module.css';
import { SectionTitle } from './SectionTitle';
import { cvStrings } from './strings';
import { cvTestIds } from './testIds';

interface EducationSectionProps {
  className?: string;
  lines: string[];
}

/** "Education": degree and university, one line each. */
export function EducationSection({ className, lines }: EducationSectionProps) {
  const strings = useStrings(cvStrings);

  return (
    <section className={className} data-testid={cvTestIds.education}>
      <SectionTitle>{strings.educationTitle}</SectionTitle>
      {lines.map((line) => (
        <p key={line} className={styles.line}>
          {line}
        </p>
      ))}
    </section>
  );
}
