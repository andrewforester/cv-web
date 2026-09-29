import type { ExperienceEntry as ExperienceEntryData } from '../../data';
import type { AgentSectionId, AgentTargetId } from '../../data/chat';
import { agentTargetProps } from './agentTarget';
import { ExperienceEntry } from './ExperienceEntry';
import { ExperienceList } from './ExperienceList';
import { SectionTitle } from './SectionTitle';

interface ExperienceSectionProps {
  className?: string;
  title: string;
  entries: ExperienceEntryData[];
  testId: string;
  sectionId: Extract<AgentSectionId, 'latest-experience' | 'previous-experience'>;
  highlightedId: AgentTargetId | null;
  /** Below-the-fold sections load their logos lazily. */
  lazy?: boolean;
}

/** An experience section ("Latest relevant experience", "Previous Experience"): title + entries. */
export function ExperienceSection({
  className,
  title,
  entries,
  testId,
  sectionId,
  highlightedId,
  lazy = false,
}: ExperienceSectionProps) {
  return (
    <section
      className={className}
      data-testid={testId}
      {...agentTargetProps('section', sectionId, highlightedId)}
    >
      <SectionTitle>{title}</SectionTitle>
      <ExperienceList>
        {entries.map((entry) => (
          <ExperienceEntry key={entry.id} entry={entry} lazy={lazy} highlightedId={highlightedId} />
        ))}
      </ExperienceList>
    </section>
  );
}
