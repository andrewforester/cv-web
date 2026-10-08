import { useStrings } from '../../../i18n';
import { ChatIcon } from '../../../shared/chat/ChatIcon';
import { chatStrings } from '../strings';
import styles from './VoiceControls.module.css';

interface VoiceEndButtonProps {
  className?: string;
  /** 44 px high in the call bar, 56 in the panel. */
  small?: boolean;
  testId: string;
  onEnd: () => void;
}

/** End: the one light control on the dark card; while connecting it cancels. */
export function VoiceEndButton({ className, small = false, testId, onEnd }: VoiceEndButtonProps) {
  const strings = useStrings(chatStrings);
  const classes = [styles.control, styles.labelled, styles.end, small && styles.small, className];
  return (
    <button
      type="button"
      className={classes.filter(Boolean).join(' ')}
      aria-label={strings.voiceEndLabel}
      data-testid={testId}
      onClick={onEnd}
    >
      <ChatIcon className={styles.icon} name="end" />
      {strings.voiceEnd}
    </button>
  );
}
