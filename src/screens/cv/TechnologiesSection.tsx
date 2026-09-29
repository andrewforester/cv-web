import type { TechnologyCard } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useStrings } from '../../i18n';
import { agentTargetProps } from './agentTarget';
import { SectionTitle } from './SectionTitle';
import { cvStrings } from './strings';
import styles from './TechnologiesSection.module.css';
import { TechnologyCardView } from './TechnologyCardView';

const COLUMNS = [1, 2, 3] as const;

interface TechnologiesSectionProps {
  className?: string;
  cards: TechnologyCard[];
  highlightedId: AgentTargetId | null;
}

/**
 * "Technologies": a 3-column masonry, cards placed by their `column`. Narrower screens reflow the
 * same cards, column by column, into 2 or 1 columns.
 */
export function TechnologiesSection({ className, cards, highlightedId }: TechnologiesSectionProps) {
  const strings = useStrings(cvStrings);

  return (
    <section className={className} {...agentTargetProps('section', 'technologies', highlightedId)}>
      <SectionTitle>{strings.technologiesTitle}</SectionTitle>
      <div className={styles.grid}>
        {COLUMNS.map((column) => (
          <div key={column} className={styles.column}>
            {cards
              .filter((card) => card.column === column)
              .map((card) => (
                <TechnologyCardView
                  key={card.id}
                  className={styles.card}
                  card={card}
                  highlightedId={highlightedId}
                />
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}
