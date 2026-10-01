import { useId } from 'react';
import { useStrings } from '../../i18n';
import { ChatCard } from '../../shared/chat/ChatCard';
import { ChatCardHeader } from '../../shared/chat/ChatCardHeader';
import { OfflineNotice } from '../../shared/chat/OfflineNotice';
import styles from './AgentChat.module.css';
import { AgentComposer } from './AgentComposer';
import { AgentMessageList } from './AgentMessageList';
import { MinimiseButton } from './MinimiseButton';
import type { RetroShowUiState } from './RetroShowUiState';
import { retroStrings } from './strings';
import { retroTestIds } from './testIds';

interface AgentChatProps {
  /** The dock places and sizes the card. */
  className?: string;
  chat: RetroShowUiState['chat'];
  onDraftChange: (draft: string) => void;
  onFocusChange: (focused: boolean) => void;
  onSend: () => void;
  onToggleMinimise: () => void;
}

/**
 * The agent chat in the site's AI chat look (SPEC → Agent chat panel): the shared card and header
 * with a minimise chevron, the conversation and the show's composer. Minimised, only the header
 * shows; the chevron or a click on the header restores it.
 */
export function AgentChat({
  className,
  chat,
  onDraftChange,
  onFocusChange,
  onSend,
  onToggleMinimise,
}: AgentChatProps) {
  const strings = useStrings(retroStrings);
  const titleId = useId();
  return (
    <ChatCard
      className={[styles.card, chat.minimised && styles.minimised, className]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={titleId}
      data-testid={retroTestIds.chat}
      onClick={chat.minimised ? onToggleMinimise : undefined}
    >
      <ChatCardHeader
        titleId={titleId}
        title={strings.chatTitle}
        subtitle={strings.chatSubtitle}
        action={<MinimiseButton minimised={chat.minimised} onToggle={onToggleMinimise} />}
      />
      <div className={styles.body} inert={chat.minimised}>
        {chat.offline && <OfflineNotice text={strings.offline} />}
        <AgentMessageList
          lines={chat.lines}
          waiting={chat.waiting}
          limitReached={chat.limitReached}
        />
        <AgentComposer
          chat={chat}
          onDraftChange={onDraftChange}
          onFocusChange={onFocusChange}
          onSend={onSend}
        />
      </div>
    </ChatCard>
  );
}
