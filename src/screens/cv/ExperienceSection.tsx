import type { ExperienceEntry as ExperienceEntryData } from '../../data';
import { ExperienceEntry } from './ExperienceEntry';
import { ExperienceList } from './ExperienceList';
import { SectionTitle } from './SectionTitle';

interface ExperienceSectionProps {
  className?: string;
  title: string;
  entries: ExperienceEntryData[];
  testId: string;
  /** Below-the-fold sections load their logos lazily. */
  lazy?: boolean;
}

/** An experience section ("Latest relevant experience", "Previous Experience"): title + entries. */
export function ExperienceSection({
  className,
  title,
  entries,
  testId,
  lazy = false,
}: ExperienceSectionProps) {
  return (
    <section className={className} data-testid={testId}>
      <SectionTitle>{title}</SectionTitle>
      <ExperienceList>
        {entries.map((entry) => (
          <ExperienceEntry key={entry.company} entry={entry} lazy={lazy} />
        ))}
      </ExperienceList>
    </section>
  );
}
