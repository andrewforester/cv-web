import { useStrings } from '../../../i18n';
import { ChatIcon } from '../../../shared/chat/ChatIcon';
import { chatStrings } from '../strings';
import { chatTestIds } from '../testIds';
import styles from './VoiceControls.module.css';
import { VoiceEndButton } from './VoiceEndButton';
import { VoiceMuteButton } from './VoiceMuteButton';
import type { VoiceActions, VoiceUiState } from './VoiceUiState';

interface VoiceControlsProps {
  className?: string;
  state: VoiceUiState;
  actions: VoiceActions;
}

/** Mute · Show chat · End under the stage. Mute works once the call is live. */
export function VoiceControls({ className, state, actions }: VoiceControlsProps) {
  const strings = useStrings(chatStrings);
  return (
    <div className={className ? `${styles.controls} ${className}` : styles.controls}>
      <VoiceMuteButton
        muted={state.muted}
        disabled={state.status !== 'live'}
        testId={chatTestIds.voiceMute}
        onToggle={actions.toggleMute}
      />
      <button
        type="button"
        className={`${styles.control} ${styles.labelled}`}
        data-testid={chatTestIds.voiceShowChat}
        onClick={actions.showChat}
      >
        <ChatIcon className={styles.icon} name="chat" />
        {strings.voiceShowChat}
      </button>
      <VoiceEndButton testId={chatTestIds.voiceEnd} onEnd={actions.end} />
    </div>
  );
}
