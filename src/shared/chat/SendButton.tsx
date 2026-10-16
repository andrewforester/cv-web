import { ChatIcon } from './ChatIcon';
import styles from './SendButton.module.css';
import { sharedChatTestIds } from './testIds';

interface SendButtonProps {
  className?: string;
  /** A reply is in progress: the button becomes Stop. */
  busy: boolean;
  canSend: boolean;
  sendLabel: string;
  stopLabel: string;
  onStop: () => void;
}

/** Round Send (submits the form) that turns into Stop while a reply is pending or streaming. */
export function SendButton({
  className,
  busy,
  canSend,
  sendLabel,
  stopLabel,
  onStop,
}: SendButtonProps) {
  const buttonClass = className ? `${styles.button} ${className}` : styles.button;

  if (busy) {
    return (
      <button
        type="button"
        className={buttonClass}
        aria-label={stopLabel}
        data-testid={sharedChatTestIds.stop}
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
      aria-label={sendLabel}
      disabled={!canSend}
      data-testid={sharedChatTestIds.send}
    >
      <ChatIcon name="send" />
    </button>
  );
}
