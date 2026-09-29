import { useStrings } from '../../i18n';
import chat from './chat.module.css';
import styles from './ChatHeader.module.css';
import { ChatIcon } from './ChatIcon';
import { chatStrings } from './strings';
import { chatTestIds } from './testIds';

interface ChatHeaderProps {
  className?: string;
  titleId: string;
  subtitleId: string;
  onClose: () => void;
}

/** Panel header: AI badge, title + subtitle (the dialog's label and description), close. */
export function ChatHeader({ className, titleId, subtitleId, onClose }: ChatHeaderProps) {
  const strings = useStrings(chatStrings);

  return (
    <header className={className ? `${styles.header} ${className}` : styles.header}>
      <span className={styles.badge} aria-hidden="true">
        <ChatIcon name="sparkle" />
      </span>
      <div className={styles.titles}>
        <h2 id={titleId} className={styles.title}>
          {strings.title}
        </h2>
        <p id={subtitleId} className={styles.subtitle}>
          {strings.subtitle}
        </p>
      </div>
      <button
        type="button"
        className={chat.iconButton}
        aria-label={strings.close}
        data-testid={chatTestIds.close}
        onClick={onClose}
      >
        <ChatIcon name="close" />
      </button>
    </header>
  );
}
