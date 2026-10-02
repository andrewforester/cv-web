import { useStrings } from '../../i18n';
import chat from '../../shared/chat/chat.module.css';
import { ChatCardHeader } from '../../shared/chat/ChatCardHeader';
import { ChatIcon } from '../../shared/chat/ChatIcon';
import { chatStrings } from './strings';
import { chatTestIds } from './testIds';

interface ChatHeaderProps {
  className?: string;
  titleId: string;
  subtitleId: string;
  /** What the assistant answers from on this page. */
  subtitle: string;
  onClose: () => void;
}

/** Panel header: the shared card header with the site's texts and a close button. */
export function ChatHeader({ className, titleId, subtitleId, subtitle, onClose }: ChatHeaderProps) {
  const strings = useStrings(chatStrings);

  return (
    <ChatCardHeader
      className={className}
      titleId={titleId}
      subtitleId={subtitleId}
      title={strings.title}
      subtitle={subtitle}
      action={
        <button
          type="button"
          className={chat.iconButton}
          aria-label={strings.close}
          data-testid={chatTestIds.close}
          onClick={onClose}
        >
          <ChatIcon name="close" />
        </button>
      }
    />
  );
}
