import type { RichText } from '../../data';
import { useStrings } from '../../i18n';
import { RichTextLine } from './RichTextLine';
import { SectionTitle } from './SectionTitle';
import styles from './SummarySection.module.css';
import { cvStrings } from './strings';
import { cvTestIds } from './testIds';

interface SummarySectionProps {
  className?: string;
  summary: RichText[];
}

/** "Summary": one line per statement; the first section after the header. */
export function SummarySection({ className, summary }: SummarySectionProps) {
  const strings = useStrings(cvStrings);

  return (
    <section className={className} data-testid={cvTestIds.summary}>
      <SectionTitle className={styles.firstTitle}>{strings.summaryTitle}</SectionTitle>
      {summary.map((line, index) => (
        <RichTextLine key={index} text={line} />
      ))}
    </section>
  );
}
