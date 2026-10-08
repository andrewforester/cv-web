import { useStrings } from '../../../i18n';
import { ChatIcon } from '../../../shared/chat/ChatIcon';
import { chatStrings } from '../strings';
import styles from './VoiceControls.module.css';

interface VoiceMuteButtonProps {
  className?: string;
  muted: boolean;
  /** Off until the call is live. */
  disabled: boolean;
  /** 44 px in the call bar, 56 in the panel. */
  small?: boolean;
  testId: string;
  onToggle: () => void;
}

/** The mic's mute toggle (`aria-pressed`); muted, it turns pink with the crossed-out mic. */
export function VoiceMuteButton({
  className,
  muted,
  disabled,
  small = false,
  testId,
  onToggle,
}: VoiceMuteButtonProps) {
  const strings = useStrings(chatStrings);
  const classes = [styles.control, styles.round, small && styles.small, className];
  return (
    <button
      type="button"
      className={classes.filter(Boolean).join(' ')}
      aria-label={muted ? strings.voiceUnmute : strings.voiceMute}
      aria-pressed={muted}
      disabled={disabled}
      data-testid={testId}
      onClick={onToggle}
    >
      <ChatIcon className={styles.icon} name={muted ? 'micOff' : 'mic'} />
    </button>
  );
}
