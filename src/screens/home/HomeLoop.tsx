import type { AgentLoop } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useStrings } from '../../i18n';
import { agentTargetProps } from '../../shared/agentTarget';
import styles from './HomeLoop.module.css';
import { HomeSection } from './HomeSection';
import { homeStrings } from './strings';
import { homeTestIds } from './testIds';

interface HomeLoopProps {
  loop: AgentLoop;
  highlightedId: AgentTargetId | null;
}

/** "How I build with agents": the dark panel with the lead, steps 01–06 and the retro footnote. */
export function HomeLoop({ loop, highlightedId }: HomeLoopProps) {
  const strings = useStrings(homeStrings);
  return (
    <HomeSection
      title={strings.loopTitle}
      note={strings.loopNote}
      testId={homeTestIds.loop}
      attributes={agentTargetProps('section', 'loop', highlightedId)}
    >
      <div className={styles.panel}>
        <p className={styles.lead}>{loop.lead}</p>
        <ol className={styles.steps}>
          {loop.steps.map((step, index) => (
            <li key={step.id} className={styles.step} data-testid={homeTestIds.loopStep}>
              <span className={styles.number}>{String(index + 1).padStart(2, '0')}</span>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
        <div className={styles.footnote}>
          <span aria-hidden="true">↺ </span>
          {loop.footnote}
        </div>
      </div>
    </HomeSection>
  );
}
