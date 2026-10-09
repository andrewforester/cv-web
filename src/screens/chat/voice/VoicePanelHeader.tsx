import { useStrings } from '../../../i18n';
import chat from '../../../shared/chat/chat.module.css';
import { ChatBadge } from '../../../shared/chat/ChatBadge';
import header from '../../../shared/chat/ChatCardHeader.module.css';
import { ChatIcon } from '../../../shared/chat/ChatIcon';
import { chatStrings } from '../strings';
import { chatTestIds } from '../testIds';
import { VoiceMinimizeButton } from './VoiceMinimizeButton';
import { VoiceOrb } from './VoiceOrb';
import styles from './VoicePanelHeader.module.css';
import { VoiceTimer } from './VoiceTimer';
import type { VoiceActions, VoiceUiState } from './VoiceUiState';

interface VoicePanelHeaderProps {
  className?: string;
  state: VoiceUiState;
  actions: VoiceActions;
}

/**
 * The call panel's header (the chat card header's anatomy): badge, "Voice call" over the timer,
 * then Show chat and minimize (off while connecting), or close (×) on a card.
 */
export function VoicePanelHeader({ className, state, actions }: VoicePanelHeaderProps) {
  const strings = useStrings(chatStrings);
  return (
    <header className={className ? `${header.header} ${className}` : header.header}>
      <ChatBadge className={styles.badge} />
      <VoiceOrb className={styles.mini} size="mini" />
      <div className={header.titles}>
        <h2 className={header.title}>{strings.voiceTitle}</h2>
        {state.status === 'live' && (
          <VoiceTimer elapsedSec={state.elapsedSec} maxCallSeconds={state.maxCallSeconds} />
        )}
      </div>
      {state.status === 'error' ? (
        <button
          type="button"
          className={chat.iconButton}
          aria-label={strings.voiceClose}
          data-testid={chatTestIds.voiceClose}
          onClick={() => actions.leaveCard('back')}
        >
          <ChatIcon name="close" />
        </button>
      ) : (
        <>
          <button
            type="button"
            className={chat.secondaryButton}
            data-testid={chatTestIds.voiceShowChat}
            onClick={actions.showChat}
          >
            {strings.voiceShowChat}
          </button>
          <VoiceMinimizeButton disabled={state.status !== 'live'} onMinimize={actions.minimize} />
        </>
      )}
    </header>
  );
}
