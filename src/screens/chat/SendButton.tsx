import { useStrings } from '../../i18n';
import { ChatIcon } from './ChatIcon';
import styles from './SendButton.module.css';
import { chatStrings } from './strings';
import { chatTestIds } from './testIds';

interface SendButtonProps {
  className?: string;
  /** A reply is in progress: the button becomes Stop. */
  busy: boolean;
  canSend: boolean;
  onStop: () => void;
}

/** Round Send (submits the form) that turns into Stop while a reply is pending or streaming. */
export function SendButton({ className, busy, canSend, onStop }: SendButtonProps) {
  const strings = useStrings(chatStrings);
  const buttonClass = className ? `${styles.button} ${className}` : styles.button;

  if (busy) {
    return (
      <button
        type="button"
        className={buttonClass}
        aria-label={strings.stop}
        data-testid={chatTestIds.stop}
        onClick={onStop}
      >
        <ChatIcon name="stop" />
      </button>
    );
  }
  return (
    <button
      type="submit"
      className={buttonClass}
      aria-label={strings.send}
      disabled={!canSend}
      data-testid={chatTestIds.send}
    >
      <ChatIcon name="send" />
    </button>
  );
}
