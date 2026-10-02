import { useStrings } from '../../i18n';
import chat from './chat.module.css';
import styles from './ConfirmationCard.module.css';
import type { ChatActionCall } from './ChatUiState';
import { chatStrings } from './strings';
import { chatTestIds } from './testIds';

interface ConfirmationCardProps {
  action: ChatActionCall;
  onConfirm: (callId: string) => void;
  onDecline: (callId: string) => void;
}

/** Asks the visitor before an outward action; the text was built from the CV, never by the model. */
export function ConfirmationCard({ action, onConfirm, onDecline }: ConfirmationCardProps) {
  const strings = useStrings(chatStrings);
  const { title = strings.confirmGeneric, detail = '' } = action.confirmation ?? {};
  const callId = action.call.id;
  return (
    <div
      className={styles.card}
      role="group"
      aria-label={title}
      data-testid={chatTestIds.confirmation}
    >
      <p className={styles.title}>{title}</p>
      {detail && <p className={`${chat.caption} ${styles.detail}`}>{detail}</p>}
      <div className={styles.buttons}>
        <button
          type="button"
          className={`${chat.secondaryButton} ${styles.confirm}`}
          data-testid={chatTestIds.confirmAction}
          onClick={() => onConfirm(callId)}
        >
          {strings.confirm}
        </button>
        <button
          type="button"
          className={chat.secondaryButton}
          data-testid={chatTestIds.declineAction}
          onClick={() => onDecline(callId)}
        >
          {strings.cancel}
        </button>
      </div>
    </div>
  );
}
