import { useStrings } from '../../../i18n';
import { ChatBadge } from '../../../shared/chat/ChatBadge';
import { ChatIcon } from '../../../shared/chat/ChatIcon';
import { chatStrings } from '../strings';
import { chatTestIds } from '../testIds';
import { VoiceTimer } from './VoiceTimer';
import styles from './VoiceTopBar.module.css';
import type { VoiceUiState } from './VoiceUiState';

interface VoiceTopBarProps {
  className?: string;
  state: VoiceUiState;
  onClose: () => void;
}

/** The title chip (the dialog's visible title), then the timer, or close (×) on an error card. */
export function VoiceTopBar({ className, state, onClose }: VoiceTopBarProps) {
  const strings = useStrings(chatStrings);
  return (
    <div className={className ? `${styles.bar} ${className}` : styles.bar}>
      <p className={styles.title}>
        <ChatBadge />
        {strings.voiceTitle}
      </p>
      {state.phase === 'error' ? (
        <button
          type="button"
          className={styles.close}
          aria-label={strings.voiceClose}
          data-testid={chatTestIds.voiceClose}
          onClick={onClose}
        >
          <ChatIcon name="close" />
        </button>
      ) : (
        state.live && (
          <VoiceTimer elapsedSec={state.elapsedSec} maxCallSeconds={state.maxCallSeconds} />
        )
      )}
    </div>
  );
}
