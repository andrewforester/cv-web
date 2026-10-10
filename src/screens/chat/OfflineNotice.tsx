import { useStrings } from '../../i18n';
import { OfflineNotice as SharedOfflineNotice } from '../../shared/chat/OfflineNotice';
import { chatStrings } from './strings';

/** The shared offline banner with the chat's text. */
export function OfflineNotice({ className }: { className?: string }) {
  const strings = useStrings(chatStrings);
  return <SharedOfflineNotice className={className} text={strings.offline} />;
}
