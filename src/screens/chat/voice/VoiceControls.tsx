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

/**
 * End and Mute, left of the call composer's field (docs/design/voice/SPEC.md → Layout 2), where
 * the call was started. Mute works once the call is live; End cancels while connecting.
 */
export function VoiceControls({ className, state, actions }: VoiceControlsProps) {
  return (
    <div className={className ? `${styles.controls} ${className}` : styles.controls}>
      <VoiceEndButton testId={chatTestIds.voiceEnd} onEnd={actions.end} />
      <VoiceMuteButton
        muted={state.muted}
        disabled={state.status !== 'live'}
        testId={chatTestIds.voiceMute}
        onToggle={actions.toggleMute}
      />
    </div>
  );
}
