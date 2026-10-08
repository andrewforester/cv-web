import type { Ref } from 'react';
import { useStrings } from '../../../i18n';
import { ChatIcon } from '../../../shared/chat/ChatIcon';
import { chatStrings } from '../strings';
import { chatTestIds } from '../testIds';
import styles from './VoiceMicButton.module.css';

interface VoiceMicButtonProps {
  className?: string;
  buttonRef?: Ref<HTMLButtonElement>;
  onStart: () => void;
}

/** The round gradient mic left of the "Ask my AI" pill: starts a call. */
export function VoiceMicButton({ className, buttonRef, onStart }: VoiceMicButtonProps) {
  const strings = useStrings(chatStrings);
  return (
    <button
      ref={buttonRef}
      type="button"
      className={className ? `${styles.mic} ${className}` : styles.mic}
      aria-label={strings.voiceMicLabel}
      aria-haspopup="dialog"
      data-testid={chatTestIds.voiceMic}
      onClick={onStart}
    >
      <ChatIcon className={styles.icon} name="mic" />
    </button>
  );
}
