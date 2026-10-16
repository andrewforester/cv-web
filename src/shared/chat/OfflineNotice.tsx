import styles from './OfflineNotice.module.css';
import { sharedChatTestIds } from './testIds';

/** Banner under the header while the browser is offline. */
interface OfflineNoticeProps {
  className?: string;
  text: string;
}

export function OfflineNotice({ className, text }: OfflineNoticeProps) {
  return (
    <p
      className={className ? `${styles.notice} ${className}` : styles.notice}
      role="status"
      data-testid={sharedChatTestIds.offline}
    >
      {text}
    </p>
  );
}
