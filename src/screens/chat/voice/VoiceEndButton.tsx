import { useStrings } from '../../../i18n';
import { ChatIcon } from '../../../shared/chat/ChatIcon';
import { chatStrings } from '../strings';
import styles from './VoiceControls.module.css';

interface VoiceEndButtonProps {
  className?: string;
  testId: string;
  onEnd: () => void;
}

/** End: the one light control on the dark card, icon-only; while connecting it cancels. */
export function VoiceEndButton({ className, testId, onEnd }: VoiceEndButtonProps) {
  const strings = useStrings(chatStrings);
  const classes = [styles.control, styles.round, styles.end, className];
  return (
    <button
      type="button"
      className={classes.filter(Boolean).join(' ')}
      aria-label={strings.voiceEndLabel}
      data-testid={testId}
      onClick={onEnd}
    >
      <ChatIcon className={styles.icon} name="end" />
    </button>
  );
}
