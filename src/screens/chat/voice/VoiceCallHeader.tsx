import { useRef, type Ref } from 'react';
import { useStrings } from '../../../i18n';
import chat from '../../../shared/chat/chat.module.css';
import { ChatBadge } from '../../../shared/chat/ChatBadge';
import header from '../../../shared/chat/ChatCardHeader.module.css';
import { ChatCollapseButton } from '../ChatCollapseButton';
import { chatStrings } from '../strings';
import { callClock } from './callClock';
import styles from './VoiceCallHeader.module.css';
import { useVoiceLevel } from './useVoiceLevel';
import { VoiceChatToggle } from './VoiceChatToggle';
import { VoiceOrb } from './VoiceOrb';
import { voiceStatusText } from './voiceStatusText';
import { VoiceTimer } from './VoiceTimer';
import type { VoiceActions, VoiceUiState } from './VoiceUiState';

interface VoiceCallHeaderProps {
  className?: string;
  titleId: string;
  /** `call`: the badge over the timer; `callChat`: the mini orb over status · time. */
  view: 'call' | 'callChat';
  state: VoiceUiState;
  actions: VoiceActions;
  /** The chat toggle, for the focus hand-off when the view swaps. */
  toggleRef?: Ref<HTMLButtonElement>;
  onCollapse: () => void;
}

/** "Speaking · 1:12" under the title while the chat shows during the call (SPEC → Layout 3). */
function CallStatusLine({ state }: { state: VoiceUiState }) {
  const strings = useStrings(chatStrings);
  const clock = callClock(state.elapsedSec, state.maxCallSeconds, strings);
  return (
    <p className={`${chat.caption} ${styles.status}`}>
      <span className={styles.live}>{voiceStatusText(state, strings)}</span>
      {state.status === 'live' && (
        <>
          {' · '}
          <b className={clock.warning ? `${styles.time} ${styles.warning}` : styles.time}>
            {clock.text}
          </b>
        </>
      )}
    </p>
  );
}

/**
 * The panel's header during a call, in both views (docs/design/voice/SPEC.md → Layouts 2, 3): the
 * left slot (the badge over the timer, or the mini orb over status · time) changes; the chat
 * toggle (hidden on a card) and collapse stay in the same places.
 */
export function VoiceCallHeader(props: VoiceCallHeaderProps) {
  const { className, titleId, view, state, actions, toggleRef, onCollapse } = props;
  const strings = useStrings(chatStrings);
  const ref = useRef<HTMLElement>(null);
  useVoiceLevel(ref, actions.level);
  const live = state.status === 'live';
  const chatShown = view === 'callChat';
  return (
    <header
      ref={ref}
      className={[header.header, styles.header, className].filter(Boolean).join(' ')}
    >
      {!chatShown && <ChatBadge className={styles.badge} />}
      <VoiceOrb className={chatShown ? undefined : styles.mini} size="mini" />
      <div className={header.titles}>
        <h2 id={titleId} className={header.title}>
          {strings.voiceTitle}
        </h2>
        {chatShown ? (
          <CallStatusLine state={state} />
        ) : (
          live && <VoiceTimer elapsedSec={state.elapsedSec} maxCallSeconds={state.maxCallSeconds} />
        )}
      </div>
      {state.status !== 'error' && (
        <VoiceChatToggle buttonRef={toggleRef} view={view} onToggle={actions.toggleChat} />
      )}
      <ChatCollapseButton callOn={live || state.status === 'connecting'} onCollapse={onCollapse} />
    </header>
  );
}
