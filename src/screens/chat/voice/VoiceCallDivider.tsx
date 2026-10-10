import chat from '../../../shared/chat/chat.module.css';
import { chatTestIds } from '../testIds';
import { VoiceAssetIcon } from './VoiceAssetIcon';
import styles from './VoiceCallDivider.module.css';

interface VoiceCallDividerProps {
  className?: string;
  text: string;
  /** The start divider carries the call's handset. */
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
        {withIcon && <VoiceAssetIcon className={styles.icon} name="call" />}
        {text}
      </span>
    </li>
  );
}
