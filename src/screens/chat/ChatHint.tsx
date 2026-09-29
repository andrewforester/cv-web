import { useStrings } from '../../i18n';
import chat from './chat.module.css';
import styles from './ChatHint.module.css';
import { ChatIcon } from './ChatIcon';
import { chatStrings } from './strings';
import { chatTestIds } from './testIds';

interface ChatHintProps {
  className?: string;
  /** Id of the text, referenced by the FAB's `aria-describedby`. */
  textId: string;
  onDismiss: () => void;
}

/** First-visit hint card to the left of the FAB, with a dismiss button. */
export function ChatHint({ className, textId, onDismiss }: ChatHintProps) {
  const strings = useStrings(chatStrings);

  return (
    <div
      className={className ? `${styles.hint} ${className}` : styles.hint}
      role="note"
      data-testid={chatTestIds.hint}
    >
      <span id={textId}>{strings.hint}</span>
      <button
        type="button"
        className={`${chat.iconButton} ${styles.dismiss}`}
        aria-label={strings.hintDismiss}
        data-testid={chatTestIds.hintDismiss}
        onClick={onDismiss}
      >
        <ChatIcon name="close" className={styles.icon} />
      </button>
    </div>
  );
}
