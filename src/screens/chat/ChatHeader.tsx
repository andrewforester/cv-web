import { useStrings } from '../../i18n';
import { ChatCardHeader } from '../../shared/chat/ChatCardHeader';
import { ChatCollapseButton } from './ChatCollapseButton';
import { chatStrings } from './strings';

interface ChatHeaderProps {
  className?: string;
  titleId: string;
  subtitleId: string;
  /** What the assistant answers from on this page. */
  subtitle: string;
  onCollapse: () => void;
}

/** The text chat's header: the shared card header with the site's texts and collapse. */
export function ChatHeader(props: ChatHeaderProps) {
  const { className, titleId, subtitleId, subtitle, onCollapse } = props;
  const strings = useStrings(chatStrings);

  return (
    <ChatCardHeader
      className={className}
      titleId={titleId}
      subtitleId={subtitleId}
      title={strings.title}
      subtitle={subtitle}
      action={<ChatCollapseButton callOn={false} onCollapse={onCollapse} />}
    />
  );
}
