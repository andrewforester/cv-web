import { useStrings } from '../../i18n';
import styles from './OfflineNotice.module.css';
import { chatStrings } from './strings';
import { chatTestIds } from './testIds';

/** Banner under the header while the browser is offline. */
export function OfflineNotice({ className }: { className?: string }) {
  const strings = useStrings(chatStrings);
  return (
    <p
      className={className ? `${styles.notice} ${className}` : styles.notice}
      role="status"
      data-testid={chatTestIds.offline}
    >
      {strings.offline}
    </p>
  );
}
