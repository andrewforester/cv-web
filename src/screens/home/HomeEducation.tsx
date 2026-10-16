import type { Education } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useStrings } from '../../i18n';
import { agentTargetProps } from '../../shared/agentTarget';
import styles from './HomeCard.module.css';
import { homeStrings } from './strings';
import { homeTestIds } from './testIds';

interface HomeEducationProps {
  education: Education;
  highlightedId: AgentTargetId | null;
}

/** The lilac education card: degree, university and years, and what it taught. */
export function HomeEducation({ education, highlightedId }: HomeEducationProps) {
  const strings = useStrings(homeStrings);
  return (
    <section
      className={`${styles.root} ${styles.violet}`}
      data-testid={homeTestIds.education}
      {...agentTargetProps('section', 'education', highlightedId)}
    >
      <span className={styles.label}>{strings.educationLabel}</span>
      <div className={styles.title}>{education.title}</div>
      <div className={styles.secondary}>
        {education.place} · {education.period}
      </div>
      <p className={styles.text}>{education.text}</p>
    </section>
  );
}
