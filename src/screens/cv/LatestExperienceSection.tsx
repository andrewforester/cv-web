import type { ExperienceEntry as ExperienceEntryData } from '../../data';
import { useStrings } from '../../i18n';
import { ExperienceEntry } from './ExperienceEntry';
import { ExperienceList } from './ExperienceList';
import { SectionTitle } from './SectionTitle';
import { cvStrings } from './strings';
import { cvTestIds } from './testIds';

interface LatestExperienceSectionProps {
  className?: string;
  entries: ExperienceEntryData[];
}

/** "Latest relevant experience" (Transcenda today). */
export function LatestExperienceSection({ className, entries }: LatestExperienceSectionProps) {
  const strings = useStrings(cvStrings);

  return (
    <section className={className} data-testid={cvTestIds.latestExperience}>
      <SectionTitle>{strings.latestExperienceTitle}</SectionTitle>
      <ExperienceList>
        {entries.map((entry) => (
          <ExperienceEntry key={entry.company} entry={entry} />
        ))}
      </ExperienceList>
    </section>
  );
}
