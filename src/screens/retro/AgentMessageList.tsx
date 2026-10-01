import { useStrings } from '../../i18n';
import { MessageRow } from '../../shared/chat/MessageRow';
import { NoticeRow } from '../../shared/chat/NoticeRow';
import { StreamingCaret } from '../../shared/chat/StreamingCaret';
import { TypingIndicator } from '../../shared/chat/TypingIndicator';
import styles from './AgentChat.module.css';
import type { ChatLineUi } from './RetroShowUiState';
import { retroStrings } from './strings';
import { retroTestIds } from './testIds';
import { useFollowLast } from './useFollowLast';

interface AgentMessageListProps {
  className?: string;
  lines: ChatLineUi[];
  waiting: boolean;
  limitReached: boolean;
}

/**
 * The conversation (a polite live region that follows the last message): agent cards on the left,
 * the visitor's navy bubbles on the right, the typing dots while a reply is on its way and the
 * limit notice once the visitor has used up their messages.
 */
export function AgentMessageList({
  className,
  lines,
  waiting,
  limitReached,
}: AgentMessageListProps) {
  const strings = useStrings(retroStrings);
  const ref = useFollowLast<HTMLOListElement>([lines, waiting, limitReached]);
  return (
    <ol
      ref={ref}
      className={[styles.list, className].filter(Boolean).join(' ')}
      role="log"
      aria-live="polite"
      aria-label={strings.listLabel}
      data-testid={retroTestIds.chatLog}
    >
      {lines.map((line) => (
        <MessageRow
          key={line.id}
          author={line.kind === 'agent' ? 'assistant' : 'visitor'}
          authorLabel={line.kind === 'agent' ? strings.agentPrefix : strings.visitorPrefix}
          testId={retroTestIds.chatLine}
        >
          {line.text}
          {line.streaming && <StreamingCaret />}
        </MessageRow>
      ))}
      {waiting && (
        <MessageRow author="assistant" authorLabel={strings.agentPrefix}>
          <TypingIndicator />
        </MessageRow>
      )}
      {limitReached && (
        <NoticeRow
          text={strings.limitReached}
          assistantLabel={strings.agentPrefix}
          tone="neutral"
        />
      )}
    </ol>
  );
}
