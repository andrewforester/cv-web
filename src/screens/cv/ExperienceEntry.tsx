import type { ExperienceEntry as ExperienceEntryData } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useStrings } from '../../i18n';
import { agentTargetProps } from './agentTarget';
import styles from './ExperienceEntry.module.css';
import { cvImageUrl } from './images';
import { RichTextLine } from './RichTextLine';
import { cvStrings } from './strings';
import { cvTestIds } from './testIds';

interface ExperienceEntryProps {
  className?: string;
  entry: ExperienceEntryData;
  highlightedId: AgentTargetId | null;
  /** Below-the-fold entries load their logo lazily. */
  lazy?: boolean;
}

/** One job: logo, company (+ "remotely"), role and period, then the bullet lines. */
export function ExperienceEntry({
  className,
  entry,
  highlightedId,
  lazy = false,
}: ExperienceEntryProps) {
  const strings = useStrings(cvStrings);

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-testid={cvTestIds.experienceEntry}
      {...agentTargetProps('experience', entry.id, highlightedId)}
    >
      <div className={styles.head}>
        <img
          className={styles.logo}
          src={cvImageUrl(entry.logo)}
          alt={entry.company}
          loading={lazy ? 'lazy' : undefined}
        />
        <h3 className={styles.company}>
          {entry.company}
          {entry.remote && <span className={styles.remote}>{strings.remotely}</span>}
        </h3>
        <p className={styles.role}>{entry.role}</p>
        <p className={styles.period}>{entry.period}</p>
      </div>
      <div className={styles.bullets}>
        {entry.bullets.map((bullet, index) => (
          <RichTextLine key={index} text={bullet} />
        ))}
      </div>
    </div>
  );
}
