import { ChatIcon } from './ChatIcon';
import styles from './ChatBadge.module.css';

interface ChatBadgeProps {
  className?: string;
}

/** The "this is AI" mark: the ✦ sparkle in a circle on the brand gradient (card header, launcher). */
export function ChatBadge({ className }: ChatBadgeProps) {
  return (
    <span className={className ? `${styles.badge} ${className}` : styles.badge} aria-hidden="true">
      <ChatIcon name="sparkle" />
    </span>
  );
}
