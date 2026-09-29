import { useStrings } from '../../i18n';
import { AnswerText } from './AnswerText';
import chat from './chat.module.css';
import type { ChatTurn } from './ChatUiState';
import { MessageRow } from './MessageRow';
import { NoticeRow } from './NoticeRow';
import { chatStrings } from './strings';
import { chatTestIds } from './testIds';
import { TypingIndicator } from './TypingIndicator';

/** The assistant side of a turn: typing dots, the streaming / finished answer and its caption. */
export function AssistantReply({ turn }: { turn: ChatTurn }) {
  const strings = useStrings(chatStrings);
  const hasText = turn.answer.trim() !== '';
  const refused = turn.status === 'done' && turn.stopReason === 'refusal';

  if (turn.status === 'pending') {
    return (
      <MessageRow author="assistant">
        <TypingIndicator />
      </MessageRow>
    );
  }
  if (refused && !hasText) return <NoticeRow text={strings.refusal} tone="neutral" />;

  const caption = turn.status === 'stopped' ? strings.stopped : refused ? strings.refusal : null;
  if (!hasText && !caption) return null;
  return (
    <MessageRow
      author="assistant"
      testId={chatTestIds.assistantMessage}
      footer={
        caption && (
          <p className={chat.caption} data-testid={chatTestIds.caption}>
            {caption}
          </p>
        )
      }
    >
      {hasText ? <AnswerText text={turn.answer} caret={turn.status === 'streaming'} /> : null}
    </MessageRow>
  );
}
