import type { ChatError } from '../../data/chat';
import { useStrings } from '../../i18n';
import { AssistantReply } from './AssistantReply';
import type { ChatTurn } from './ChatUiState';
import { errorTextKey, isNeutralError } from './errorText';
import { MessageRow } from './MessageRow';
import { RoundView } from './RoundView';
import { NoticeRow, type NoticeAction } from './NoticeRow';
import { chatStrings, formatString } from './strings';
import { chatTestIds } from './testIds';

interface TurnViewProps {
  turn: ChatTurn;
  /** Only the last turn offers Try again. */
  isLast: boolean;
  /** During a call: the notice offers neither Try again nor New chat. */
  readOnly?: boolean;
  maxInputLength: number;
  onRetry: () => void;
  onNewChat: () => void;
  onConfirmAction: (callId: string) => void;
  onDeclineAction: (callId: string) => void;
}

/** One question and everything that answers it: visitor bubble, tool rounds (chips, cards), reply, error notice. */
export function TurnView({
  turn,
  isLast,
  readOnly = false,
  maxInputLength,
  onRetry,
  onNewChat,
  onConfirmAction,
  onDeclineAction,
}: TurnViewProps) {
  const strings = useStrings(chatStrings);

  const noticeAction = (error: ChatError): NoticeAction | undefined => {
    if (readOnly) return undefined;
    if (error.code === 'conversation_limit') {
      return { label: strings.newChat, testId: chatTestIds.newChat, onClick: onNewChat };
    }
    if (error.retryable && isLast) {
      return { label: strings.retry, testId: chatTestIds.retry, onClick: onRetry };
    }
    return undefined;
  };

  const errorNotice = (error: ChatError) => {
    const action = noticeAction(error);
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
      {turn.rounds.map((round, index) => (
        <RoundView
          key={index}
          round={round}
          onConfirm={onConfirmAction}
          onDecline={onDeclineAction}
        />
      ))}
      <AssistantReply turn={turn} />
      {turn.status === 'error' && turn.error && errorNotice(turn.error)}
    </>
  );
}
