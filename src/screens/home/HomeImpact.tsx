import type { ImpactCard } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useStrings } from '../../i18n';
import { agentTargetProps } from '../../shared/agentTarget';
import styles from './HomeImpact.module.css';
import { HomeSection } from './HomeSection';
import { homeStrings } from './strings';
import { homeTestIds } from './testIds';
import { motionTarget } from './motion/motionTargets';

/** Card tones by position: lilac, pink, neutral. */
const TONES = [styles.lilac, styles.pink, styles.neutral];

interface HomeImpactProps {
  impact: ImpactCard[];
  highlightedId: AgentTargetId | null;
}

/** "Selected impact": a big figure and its story per card (agent targets `impact:<id>`). */
export function HomeImpact({ impact, highlightedId }: HomeImpactProps) {
  const strings = useStrings(homeStrings);
  return (
    <HomeSection
      title={strings.impactTitle}
      testId={homeTestIds.impact}
      attributes={agentTargetProps('section', 'impact', highlightedId)}
    >
      <div className={styles.cards} {...motionTarget('impact')}>
        {impact.map((card, index) => (
          <div
            key={card.id}
            className={`${styles.card} ${TONES[index % TONES.length] ?? ''}`}
            data-testid={homeTestIds.impactCard}
            {...agentTargetProps('impact', card.id, highlightedId)}
            {...motionTarget('card')}
          >
            <div className={styles.value} {...motionTarget('count')}>
              {card.value}
            </div>
            <div className={styles.text}>{card.text}</div>
          </div>
        ))}
      </div>
    </HomeSection>
  );
}
