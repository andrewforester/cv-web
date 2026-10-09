import { chatTestIds } from '../testIds';
import { VoiceEndButton } from './VoiceEndButton';
import { VoiceMuteButton } from './VoiceMuteButton';
import type { VoiceActions, VoiceUiState } from './VoiceUiState';

interface VoiceCallControlsProps {
  state: VoiceUiState;
  actions: VoiceActions;
}

/**
 * The call composer's left slot (docs/design/voice/SPEC.md → Layout 2), the same in both call
 * views: End where Call was (it cancels while connecting), then Mute (once live).
 */
export function VoiceCallControls({ state, actions }: VoiceCallControlsProps) {
  return (
    <>
      <VoiceEndButton testId={chatTestIds.voiceEnd} onEnd={actions.end} />
      <VoiceMuteButton
        muted={state.muted}
        disabled={state.status !== 'live'}
        testId={chatTestIds.voiceMute}
        onToggle={actions.toggleMute}
      />
    </>
  );
}
