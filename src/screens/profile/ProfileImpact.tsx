import type { Profile } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useStrings } from '../../i18n';
import { agentTargetProps } from '../../shared/agentTarget';
import { ImpactCards } from '../../shared/forest/ImpactCards';
import { Section } from '../../shared/forest/Section';
import { profileStrings } from './strings';
import { profileTestIds } from './testIds';

interface ProfileImpactProps {
  className?: string;
  index: number;
  impact: Profile['impact'];
  highlightedId: AgentTargetId | null;
}

/** Selected impact: the figure cards, each an agent target (`impact:<id>`). */
export function ProfileImpact({ className, index, impact, highlightedId }: ProfileImpactProps) {
  const strings = useStrings(profileStrings);
  return (
    <Section
      className={className}
      index={index}
      title={strings.impactTitle}
      testId={profileTestIds.impact}
      attributes={agentTargetProps('section', 'impact', highlightedId)}
    >
      <ImpactCards
        items={impact.map((card) => ({
          ...card,
          attributes: agentTargetProps('impact', card.id, highlightedId),
        }))}
      />
    </Section>
  );
}
