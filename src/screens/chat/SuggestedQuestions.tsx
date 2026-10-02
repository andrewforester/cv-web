import { useStrings } from '../../i18n';
import { ChipGroup } from './ChipGroup';
import { chatStrings } from './strings';
import styles from './SuggestedQuestions.module.css';
import { chatTestIds } from './testIds';

interface SuggestedQuestionsProps {
  suggestions: readonly string[];
  /** Example commands; none while the page tools aren't mounted. */
  commands: readonly string[];
  onAsk: (question: string) => void;
}

/** The empty state: "Try asking" question chips and, with page tools, example command chips. */
export function SuggestedQuestions({ suggestions, commands, onAsk }: SuggestedQuestionsProps) {
  const strings = useStrings(chatStrings);
  return (
    <div className={styles.groups}>
      <ChipGroup
        label={strings.tryAsking}
        items={suggestions}
        testId={chatTestIds.suggestion}
        onPick={onAsk}
      />
      {commands.length > 0 && (
        <ChipGroup
          label={strings.commandsLabel}
          items={commands}
          testId={chatTestIds.command}
          onPick={onAsk}
        />
      )}
    </div>
  );
}
