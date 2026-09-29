import type { ChatError } from '../../data/chat';
import { useStrings } from '../../i18n';
import { AssistantReply } from './AssistantReply';
import type { ChatTurn } from './ChatUiState';
import { errorTextKey, isNeutralError } from './errorText';
import { MessageRow } from './MessageRow';
import { NoticeRow, type NoticeAction } from './NoticeRow';
import { chatStrings, formatString } from './strings';
import { chatTestIds } from './testIds';

interface TurnViewProps {
  turn: ChatTurn;
  /** Only the last turn offers Try again. */
  isLast: boolean;
  maxInputLength: number;
  onRetry: () => void;
  onNewChat: () => void;
}

/** One question and everything that answers it: visitor bubble, reply, error notice. */
export function TurnView({ turn, isLast, maxInputLength, onRetry, onNewChat }: TurnViewProps) {
  const strings = useStrings(chatStrings);

  const errorNotice = (error: ChatError) => {
    let action: NoticeAction | undefined;
    if (error.code === 'conversation_limit') {
      action = { label: strings.newChat, testId: chatTestIds.newChat, onClick: onNewChat };
    } else if (error.retryable && isLast) {
      action = { label: strings.retry, testId: chatTestIds.retry, onClick: onRetry };
    }
    const text = formatString(strings[errorTextKey(error)], { max: maxInputLength });
    return (
      <NoticeRow
        text={text}
        tone={isNeutralError(error.code) ? 'neutral' : 'error'}
        action={action}
      />
    );
  };

  return (
    <>
      <MessageRow author="visitor" testId={chatTestIds.visitorMessage}>
        {turn.question}
      </MessageRow>
      <AssistantReply turn={turn} />
      {turn.status === 'error' && turn.error && errorNotice(turn.error)}
    </>
  );
}
