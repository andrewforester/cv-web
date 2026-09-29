import type { TechnologyCard } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { agentTargetProps } from './agentTarget';
import { cvIcons } from './images';
import { cvTestIds } from './testIds';
import styles from './TechnologyCardView.module.css';

interface TechnologyCardViewProps {
  className?: string;
  card: TechnologyCard;
  highlightedId: AgentTargetId | null;
}

/** A technology card: title and a comma-separated list; `highlighted` and `ai` restyle the border. */
export function TechnologyCardView({ className, card, highlightedId }: TechnologyCardViewProps) {
  return (
    <div
      className={[styles.card, styles[card.variant], className].filter(Boolean).join(' ')}
      data-testid={cvTestIds.technologyCard}
      {...agentTargetProps('technology', card.id, highlightedId)}
    >
      <h3 className={styles.title}>{card.title}</h3>
      <p className={styles.body}>{card.items.join(', ')}</p>
      {card.variant === 'highlighted' && (
        <img className={styles.star} src={cvIcons.starCard} alt="" />
      )}
    </div>
  );
}
