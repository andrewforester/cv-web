import { useStrings } from '../../../i18n';
import { chatStrings, type ChatStrings } from '../strings';
import { chatTestIds } from '../testIds';
import { VoiceActionChip } from './VoiceActionChip';
import { VoiceContactCard } from './VoiceContactCard';
import { VoiceErrorCard } from './VoiceErrorCard';
import type { VoiceErrorButton } from './voiceErrorCards';
import { VoiceOrb } from './VoiceOrb';
import styles from './VoiceStage.module.css';
import { voiceStatusText } from './voiceStatusText';
import type { VoiceActions, VoiceUiState } from './VoiceUiState';

interface VoiceStageProps {
  className?: string;
  state: VoiceUiState;
  actions: VoiceActions;
  onErrorButton: (button: VoiceErrorButton) => void;
}

function captionText(state: VoiceUiState, strings: ChatStrings): string {
  if (state.status === 'connecting')
    return state.permission === 'pending' ? strings.voiceAllowMic : '';
  if (state.muted && state.phase === 'listening') return strings.voiceMutedCaption;
  return state.caption?.text ?? '';
}

/** The middle of the call panel: the action chip, the orb, then the status and caption, or a card. */
export function VoiceStage({ className, state, actions, onErrorButton }: VoiceStageProps) {
  const strings = useStrings(chatStrings);
  const visitorCaption = state.caption?.role === 'visitor' && !state.muted;
  return (
    <div className={className ? `${styles.stage} ${className}` : styles.stage}>
      {state.action && <VoiceActionChip action={state.action} />}
      <VoiceOrb className={styles.orb} />
      {state.error ? (
        <VoiceErrorCard error={state.error} onButton={onErrorButton} />
      ) : state.contact ? (
        <VoiceContactCard
          contact={state.contact}
          onOpened={actions.contactOpened}
          onCancel={actions.contactCancelled}
        />
      ) : (
        <>
          <p className={styles.status} data-testid={chatTestIds.voiceStatus}>
            {voiceStatusText(state, strings)}
          </p>
          <p
            className={visitorCaption ? `${styles.caption} ${styles.visitor}` : styles.caption}
            data-testid={chatTestIds.voiceCaption}
          >
            {captionText(state, strings)}
          </p>
          {state.status === 'connecting' && (
            <p className={styles.privacy}>{strings.voicePrivacy}</p>
          )}
        </>
      )}
    </div>
  );
}
