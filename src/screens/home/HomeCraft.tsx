import type { CraftCard } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useStrings } from '../../i18n';
import { agentTargetProps } from '../../shared/agentTarget';
import styles from './HomeCraft.module.css';
import { HomeSection } from './HomeSection';
import { homeStrings } from './strings';
import { homeTestIds } from './testIds';

/** Card tones by position: hand-written code on neutral, the agentic process on pink. */
const TONES = [styles.neutral, styles.pink];

interface HomeCraftProps {
  craft: CraftCard[];
  highlightedId: AgentTargetId | null;
}

/** "Code craft × agentic process": the before-AI and with-agents cards side by side. */
export function HomeCraft({ craft, highlightedId }: HomeCraftProps) {
  const strings = useStrings(homeStrings);
  return (
    <HomeSection
      title={strings.craftTitle}
      testId={homeTestIds.craft}
      attributes={agentTargetProps('section', 'craft', highlightedId)}
    >
      <div className={styles.cards}>
        {craft.map((card, index) => (
          <div
            key={card.id}
            className={`${styles.card} ${TONES[index % TONES.length] ?? ''}`}
            data-testid={homeTestIds.craftCard}
          >
            <span className={styles.label}>{card.label}</span>
            <div className={styles.title}>{card.title}</div>
            <p className={styles.text}>{card.text}</p>
          </div>
        ))}
      </div>
    </HomeSection>
  );
}
