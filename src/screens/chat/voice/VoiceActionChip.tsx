import { useStrings } from '../../../i18n';
import { ChatIcon } from '../../../shared/chat/ChatIcon';
import { actionText } from '../actionText';
import type { ChatActionCall } from '../ChatUiState';
import { chatStrings } from '../strings';
import { chatTestIds } from '../testIds';
import styles from './VoiceActionChip.module.css';

interface VoiceActionChipProps {
  className?: string;
  action: ChatActionCall;
}

/** What the agent is doing on the page, under the top bar (the text chat's action texts). */
export function VoiceActionChip({ className, action }: VoiceActionChipProps) {
  const strings = useStrings(chatStrings);
  return (
    <p
      className={className ? `${styles.chip} ${className}` : styles.chip}
      data-testid={chatTestIds.voiceAction}
    >
      <ChatIcon className={styles.icon} name="sparkle" />
      {actionText(action, strings)}
    </p>
  );
}
