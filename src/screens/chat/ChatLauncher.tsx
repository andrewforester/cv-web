import { useId, type Ref } from 'react';
import { useStrings } from '../../i18n';
import { ChatHint } from './ChatHint';
import { ChatIcon } from '../../shared/chat/ChatIcon';
import styles from './ChatLauncher.module.css';
import { chatStrings } from './strings';
import { CHAT_PANEL_ID, chatTestIds } from './testIds';

interface ChatLauncherProps {
  className?: string;
  fabRef: Ref<HTMLButtonElement>;
  hintVisible: boolean;
  onOpen: () => void;
  onDismissHint: () => void;
}

/** The closed state: the floating chat button with its AI ring, and the first-visit hint. */
export function ChatLauncher({
  className,
  fabRef,
  hintVisible,
  onOpen,
  onDismissHint,
}: ChatLauncherProps) {
  const strings = useStrings(chatStrings);
  const hintId = useId();

  return (
    <div className={className ? `${styles.launcher} ${className}` : styles.launcher}>
      {hintVisible && <ChatHint textId={hintId} onDismiss={onDismissHint} />}
      <button
        ref={fabRef}
        type="button"
        className={styles.fab}
        aria-label={strings.fabLabel}
        aria-haspopup="dialog"
        aria-expanded={false}
        aria-controls={CHAT_PANEL_ID}
        aria-describedby={hintVisible ? hintId : undefined}
        data-testid={chatTestIds.fab}
        onClick={onOpen}
      >
        <ChatIcon name="chat" className={styles.icon} />
      </button>
    </div>
  );
}
