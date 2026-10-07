import { ChatIcon } from '../../../shared/chat/ChatIcon';
import chat from '../../../shared/chat/chat.module.css';
import { chatTestIds } from '../testIds';
import styles from './VoiceCallDivider.module.css';

interface VoiceCallDividerProps {
  className?: string;
  text: string;
  /** The start divider carries the mic. */
  withIcon?: boolean;
}

/** A mono caption between two hairlines: where a voice call starts and ends in the chat. */
export function VoiceCallDivider({ className, text, withIcon = false }: VoiceCallDividerProps) {
  return (
    <li
      className={[styles.divider, chat.caption, className].filter(Boolean).join(' ')}
      data-testid={chatTestIds.voiceDivider}
    >
      <span className={styles.label}>
        {withIcon && <ChatIcon className={styles.icon} name="mic" />}
        {text}
      </span>
    </li>
  );
}
