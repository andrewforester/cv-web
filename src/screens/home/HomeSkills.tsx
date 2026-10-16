import type { SkillGroup } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useStrings } from '../../i18n';
import { agentTargetProps } from '../../shared/agentTarget';
import { HomeSection } from './HomeSection';
import styles from './HomeSkills.module.css';
import { homeStrings } from './strings';
import { homeTestIds } from './testIds';

interface HomeSkillsProps {
  skills: SkillGroup[];
  highlightedId: AgentTargetId | null;
}

/** "Skills": the groups in up to three columns, each under a rule (agent targets `skill:<id>`). */
export function HomeSkills({ skills, highlightedId }: HomeSkillsProps) {
  const strings = useStrings(homeStrings);
  return (
    <HomeSection
      title={strings.skillsTitle}
      testId={homeTestIds.skills}
      attributes={agentTargetProps('section', 'skills', highlightedId)}
    >
      <div className={styles.grid}>
        {skills.map((group) => (
          <div
            key={group.id}
            className={styles.group}
            data-testid={homeTestIds.skill}
            {...agentTargetProps('skill', group.id, highlightedId)}
          >
            <div className={styles.title}>{group.title}</div>
            <div className={styles.items}>{group.items}</div>
          </div>
        ))}
      </div>
    </HomeSection>
  );
}
