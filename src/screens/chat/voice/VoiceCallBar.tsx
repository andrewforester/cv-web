import { useStrings } from '../../../i18n';
import chat from '../../../shared/chat/chat.module.css';
import { chatStrings } from '../strings';
import { chatTestIds } from '../testIds';
import styles from './VoiceCallBar.module.css';
import { VoiceEndButton } from './VoiceEndButton';
import { VoiceMuteButton } from './VoiceMuteButton';
import type { VoiceActions, VoiceUiState } from './VoiceUiState';

interface VoiceCallBarProps {
  className?: string;
  state: VoiceUiState;
  actions: VoiceActions;
}

/**
 * Replaces the composer while a call is live (docs/design/voice/SPEC.md → Layout 3): Mute, the
 * read-only note, End. No field: End is the visitor's way to type.
 */
export function VoiceCallBar({ className, state, actions }: VoiceCallBarProps) {
  const strings = useStrings(chatStrings);
  return (
    <div
      className={className ? `${styles.bar} ${className}` : styles.bar}
      data-testid={chatTestIds.voiceCallbar}
    >
      <VoiceMuteButton
        small
        muted={state.muted}
        disabled={state.status !== 'live'}
        testId={chatTestIds.voiceCallbarMute}
        onToggle={actions.toggleMute}
      />
      <p className={`${chat.caption} ${styles.note}`}>{strings.voiceReadOnly}</p>
      <VoiceEndButton small testId={chatTestIds.voiceCallbarEnd} onEnd={actions.end} />
    </div>
  );
}
