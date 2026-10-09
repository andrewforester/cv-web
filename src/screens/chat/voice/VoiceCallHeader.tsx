import { useRef, type Ref } from 'react';
import { useStrings } from '../../../i18n';
import chat from '../../../shared/chat/chat.module.css';
import header from '../../../shared/chat/ChatCardHeader.module.css';
import { chatStrings } from '../strings';
import { CHAT_PANEL_ID } from '../testIds';
import { callClock } from './callClock';
import styles from './VoiceCallHeader.module.css';
import { useVoiceLevel } from './useVoiceLevel';
import { VoiceChatToggle } from './VoiceChatToggle';
import { VoiceMinimizeButton } from './VoiceMinimizeButton';
import { VoiceOrb } from './VoiceOrb';
import { voiceStatusText } from './voiceStatusText';
import type { VoiceActions, VoiceUiState } from './VoiceUiState';

interface VoiceCallHeaderProps {
  className?: string;
  titleId: string;
  state: VoiceUiState;
  actions: VoiceActions;
  /** The chat toggle, for the focus hand-off when the view swaps. */
  toggleRef?: Ref<HTMLButtonElement>;
}

/**
 * The chat's header while a call is live (docs/design/voice/SPEC.md → Layout 3): the mini orb,
 * "Voice call" over "Speaking · 1:12", the chat toggle (Hide chat) and minimize, in the same
 * places as in the call panel's header.
 */
export function VoiceCallHeader(props: VoiceCallHeaderProps) {
  const { className, titleId, state, actions, toggleRef } = props;
  const strings = useStrings(chatStrings);
  const ref = useRef<HTMLElement>(null);
  useVoiceLevel(ref, actions.level);
  const clock = callClock(state.elapsedSec, state.maxCallSeconds, strings);
  const live = state.status === 'live';
  return (
    <header
      ref={ref}
      className={[header.header, styles.header, className].filter(Boolean).join(' ')}
      data-phase={state.phase}
      data-muted={state.muted}
    >
      <VoiceOrb size="mini" />
      <div className={header.titles}>
        <h2 id={titleId} className={header.title}>
          {strings.voiceTitle}
        </h2>
        <p className={`${chat.caption} ${styles.status}`}>
          <span className={styles.live}>{voiceStatusText(state, strings)}</span>
          {live && (
            <>
              {' · '}
              <b className={clock.warning ? `${styles.time} ${styles.warning}` : styles.time}>
                {clock.text}
              </b>
            </>
          )}
        </p>
      </div>
      <VoiceChatToggle
        buttonRef={toggleRef}
        view="callChat"
        controls={CHAT_PANEL_ID}
        onToggle={actions.toggleChat}
      />
      <VoiceMinimizeButton disabled={!live} onMinimize={actions.minimize} />
    </header>
  );
}
