import { useStrings } from '../../i18n';
import chat from '../../shared/chat/chat.module.css';
import { ChatIcon } from '../../shared/chat/ChatIcon';
import { chatStrings } from './strings';
import { CHAT_PANEL_ID, chatTestIds } from './testIds';

interface ChatCollapseButtonProps {
  className?: string;
  /** A call is connecting or live: the name says it goes on. */
  callOn: boolean;
  onCollapse: () => void;
}

/**
 * The one way out of the panel, the last item of every header (docs/design/voice/SPEC.md →
 * Layout 2, ADR-0013 → Decision 2): folds the whole panel into the launcher, or into the call
 * pill while a call is on.
 */
export function ChatCollapseButton({ className, callOn, onCollapse }: ChatCollapseButtonProps) {
  const strings = useStrings(chatStrings);
  return (
    <button
      type="button"
      className={className ? `${chat.iconButton} ${className}` : chat.iconButton}
      aria-label={callOn ? strings.voiceCollapse : strings.collapse}
      aria-expanded={true}
      aria-controls={CHAT_PANEL_ID}
      data-testid={chatTestIds.collapse}
      onClick={onCollapse}
    >
      <ChatIcon name="collapse" />
    </button>
  );
}
