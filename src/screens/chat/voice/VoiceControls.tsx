import { useStrings } from '../../../i18n';
import { ChatIcon } from '../../../shared/chat/ChatIcon';
import { chatStrings } from '../strings';
import { chatTestIds } from '../testIds';
import styles from './VoiceControls.module.css';
import type { VoiceActions, VoiceUiState } from './VoiceUiState';

interface VoiceControlsProps {
  className?: string;
  state: VoiceUiState;
  actions: VoiceActions;
}

/** Mute · End · Switch to text chat. Mute works once the call is live. */
export function VoiceControls({ className, state, actions }: VoiceControlsProps) {
  const strings = useStrings(chatStrings);
  return (
    <div className={className ? `${styles.controls} ${className}` : styles.controls}>
      <button
        type="button"
        className={styles.round}
        aria-label={state.muted ? strings.voiceUnmute : strings.voiceMute}
        aria-pressed={state.muted}
        disabled={!state.live}
        data-testid={chatTestIds.voiceMute}
        onClick={actions.toggleMute}
      >
        <ChatIcon className={styles.icon} name={state.muted ? 'micOff' : 'mic'} />
      </button>
      <button
        type="button"
        className={styles.end}
        aria-label={strings.voiceEndLabel}
        data-testid={chatTestIds.voiceEnd}
        onClick={actions.end}
      >
        <ChatIcon className={styles.icon} name="end" />
        {strings.voiceEnd}
      </button>
      <button
        type="button"
        className={styles.round}
        aria-label={strings.voiceToChat}
        data-testid={chatTestIds.voiceToChat}
        onClick={actions.switchToChat}
      >
        <ChatIcon className={styles.icon} name="chat" />
      </button>
    </div>
  );
}
