import { useId } from 'react';
import { useStrings } from '../../i18n';
import chat from './chat.module.css';
import { chatStrings } from './strings';
import styles from './SuggestedQuestions.module.css';
import { chatTestIds } from './testIds';

interface SuggestedQuestionsProps {
  className?: string;
  onAsk: (question: string) => void;
}

/** "Try asking" + four question chips of the empty state; a chip sends its question. */
export function SuggestedQuestions({ className, onAsk }: SuggestedQuestionsProps) {
  const strings = useStrings(chatStrings);
  const labelId = useId();
  const questions = [
    strings.suggestion1,
    strings.suggestion2,
    strings.suggestion3,
    strings.suggestion4,
  ];

  return (
    <div
      className={className ? `${styles.group} ${className}` : styles.group}
      role="group"
      aria-labelledby={labelId}
    >
      <p id={labelId} className={`${chat.caption} ${styles.label}`}>
        {strings.tryAsking}
      </p>
      {questions.map((question) => (
        <button
          key={question}
          type="button"
          className={styles.chip}
          data-testid={chatTestIds.suggestion}
          onClick={() => onAsk(question)}
        >
          {question}
        </button>
      ))}
    </div>
  );
}
