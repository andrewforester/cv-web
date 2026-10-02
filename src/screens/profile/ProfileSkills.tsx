import type { Profile } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useStrings } from '../../i18n';
import { agentTargetProps } from '../../shared/agentTarget';
import { Section } from '../../shared/forest/Section';
import { SkillsGrid } from '../../shared/forest/SkillsGrid';
import { profileStrings } from './strings';
import { profileTestIds } from './testIds';

interface ProfileSkillsProps {
  className?: string;
  index: number;
  skills: Profile['skills'];
  highlightedId: AgentTargetId | null;
}

/** Skills: the skill groups, each an agent target (`skill:<id>`). */
export function ProfileSkills({ className, index, skills, highlightedId }: ProfileSkillsProps) {
  const strings = useStrings(profileStrings);
  return (
    <Section
      className={className}
      index={index}
      title={strings.skillsTitle}
      testId={profileTestIds.skills}
      attributes={agentTargetProps('section', 'skills', highlightedId)}
    >
      <SkillsGrid
        groups={skills.map((group) => ({
          ...group,
          attributes: agentTargetProps('skill', group.id, highlightedId),
        }))}
      />
    </Section>
  );
}
