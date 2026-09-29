import type { RichText } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useStrings } from '../../i18n';
import { agentTargetProps } from './agentTarget';
import { RichTextLine } from './RichTextLine';
import { SectionTitle } from './SectionTitle';
import styles from './SummarySection.module.css';
import { cvStrings } from './strings';
import { cvTestIds } from './testIds';

interface SummarySectionProps {
  className?: string;
  summary: RichText[];
  highlightedId: AgentTargetId | null;
}

/** "Summary": one line per statement; the first section after the header. */
export function SummarySection({ className, summary, highlightedId }: SummarySectionProps) {
  const strings = useStrings(cvStrings);

  return (
    <section
      className={className}
      data-testid={cvTestIds.summary}
      {...agentTargetProps('section', 'summary', highlightedId)}
    >
      <SectionTitle className={styles.firstTitle}>{strings.summaryTitle}</SectionTitle>
      {summary.map((line, index) => (
        <RichTextLine key={index} text={line} />
      ))}
    </section>
  );
}
