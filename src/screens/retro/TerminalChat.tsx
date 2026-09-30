import { useStrings } from '../../i18n';
import chatIcon from './assets/retro_icon_chat.svg';
import { ChatComposer } from './ChatComposer';
import { ChatLog } from './ChatLog';
import type { RetroShowUiState } from './RetroShowUiState';
import { retroStrings } from './strings';
import { retroTestIds } from './testIds';
import styles from './TerminalChat.module.css';
import { Win98Window } from './Win98Window';
import windowStyles from './Win98Window.module.css';

interface TerminalChatProps {
  className?: string;
  chat: RetroShowUiState['chat'];
  /** The console is minimised or closed: the chat takes the dock's height. */
  fill: boolean;
  onDraftChange: (draft: string) => void;
  onFocusChange: (focused: boolean) => void;
  onSend: () => void;
  onToggleMinimise: () => void;
}

/** The agent chat: a Win98 window with an IRC-style log, the visitor's composer and a status bar. */
export function TerminalChat({
  className,
  chat,
  fill,
  onDraftChange,
  onFocusChange,
  onSend,
  onToggleMinimise,
}: TerminalChatProps) {
  const strings = useStrings(retroStrings);
  return (
    <Win98Window
      className={[styles.chat, fill && styles.grow, className].filter(Boolean).join(' ')}
      title={strings.chatTitle}
      icon={chatIcon}
      label={strings.chatLabel}
      testId={retroTestIds.chat}
      minimised={chat.minimised}
      onToggleMinimise={onToggleMinimise}
    >
      <ChatLog lines={chat.lines} />
      <ChatComposer
        draft={chat.draft}
        limitReached={chat.limitReached}
        readOnly={chat.readOnly}
        canSend={chat.canSend}
        onDraftChange={onDraftChange}
        onFocusChange={onFocusChange}
        onSend={onSend}
      />
      <div className={styles.status}>
        <span className={windowStyles.cell}>{strings.statusConnected}</span>
        <span className={windowStyles.cell}>{strings.statusUsers}</span>
        <span className={windowStyles.cell}>{strings.statusLocale}</span>
      </div>
    </Win98Window>
  );
}
