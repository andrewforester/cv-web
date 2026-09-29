import { useStrings } from '../../i18n';
import { ChipGroup } from './ChipGroup';
import { chatStrings } from './strings';
import styles from './SuggestedQuestions.module.css';
import { chatTestIds } from './testIds';

interface SuggestedQuestionsProps {
  /** Page tools are mounted: also offer example commands. */
  commands: boolean;
  onAsk: (question: string) => void;
}

/** The empty state: "Try asking" question chips and, with page tools, example command chips. */
export function SuggestedQuestions({ commands, onAsk }: SuggestedQuestionsProps) {
  const strings = useStrings(chatStrings);
  return (
    <div className={styles.groups}>
      <ChipGroup
        label={strings.tryAsking}
        items={[strings.suggestion1, strings.suggestion2, strings.suggestion3, strings.suggestion4]}
        testId={chatTestIds.suggestion}
        onPick={onAsk}
      />
      {commands && (
        <ChipGroup
          label={strings.commandsLabel}
          items={[strings.command1, strings.command2, strings.command3]}
          testId={chatTestIds.command}
          onPick={onAsk}
        />
      )}
    </div>
  );
}
