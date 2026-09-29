import { useStrings } from '../../i18n';
import { actionText } from './actionText';
import styles from './ActionChip.module.css';
import type { ChatActionCall } from './ChatUiState';
import { ChatIcon } from './ChatIcon';
import { chatStrings } from './strings';
import { chatTestIds } from './testIds';

/** The "running action" chip of one tool call; it turns into the outcome once the call is done. */
export function ActionChip({ action }: { action: ChatActionCall }) {
  const strings = useStrings(chatStrings);
  const outcome = !action.result ? 'running' : action.result.ok ? 'done' : 'failed';
  return (
    <p className={`${styles.chip} ${styles[outcome]}`} data-testid={chatTestIds.actionChip}>
      <ChatIcon className={styles.icon} name="sparkle" />
      {actionText(action, strings)}
    </p>
  );
}
