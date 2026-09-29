import { useStrings } from '../../i18n';
import { actionText } from './actionText';
import { answerPlainText } from './answerMarkdown';
import chat from './chat.module.css';
import type { ChatAnnouncement } from './ChatUiState';
import { errorTextKey } from './errorText';
import { chatStrings, formatString, type ChatStrings } from './strings';
import { chatTestIds } from './testIds';

interface LiveAnnouncerProps {
  announcement: ChatAnnouncement | null;
  maxInputLength: number;
}

/**
 * The dialog's one polite live region: "typing" on send, each page action's confirmation question and outcome, the complete answer as plain text,
 * "stopped", error texts, the length limit. Streamed tokens are never announced one by one.
 */
export function LiveAnnouncer({ announcement, maxInputLength }: LiveAnnouncerProps) {
  const strings = useStrings(chatStrings);
  return (
    <div
      className={chat.srOnly}
      aria-live="polite"
      aria-atomic="true"
      data-testid={chatTestIds.announcer}
    >
      {announcement && announcementText(announcement, strings, maxInputLength)}
    </div>
  );
}

function announcementText(
  announcement: ChatAnnouncement,
  strings: ChatStrings,
  max: number,
): string {
  switch (announcement.kind) {
    case 'typing':
      return strings.typing;
    case 'stopped':
      return strings.stopped;
    case 'action':
      return actionText(announcement.action, strings);
    case 'tooLong':
      return formatString(strings.tooLong, { max });
    case 'error':
      return formatString(strings[errorTextKey(announcement)], { max });
    case 'answer': {
      const text = answerPlainText(announcement.text);
      return announcement.stopReason === 'refusal'
        ? [text, strings.refusal].filter(Boolean).join('\n')
        : text;
    }
  }
}
