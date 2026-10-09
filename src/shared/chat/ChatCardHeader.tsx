import type { ReactNode } from 'react';
import chat from './chat.module.css';
import { ChatBadge } from './ChatBadge';
import styles from './ChatCardHeader.module.css';

interface ChatCardHeaderProps {
  className?: string;
  /** Ids for the card's `aria-labelledby` / `aria-describedby`. */
  titleId?: string;
  subtitleId?: string;
  title: string;
  subtitle: string;
  /** The trailing button: the collapse control on the site (`chat-collapse`), minimise in the show. */
  action: ReactNode;
}

/** Card header: AI badge, title + subtitle, one trailing action. */
export function ChatCardHeader({
  className,
  titleId,
  subtitleId,
  title,
  subtitle,
  action,
}: ChatCardHeaderProps) {
  return (
    <header className={className ? `${styles.header} ${className}` : styles.header}>
      <ChatBadge />
      <div className={styles.titles}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p id={subtitleId} className={chat.caption}>
          {subtitle}
        </p>
      </div>
      {action}
    </header>
  );
}
