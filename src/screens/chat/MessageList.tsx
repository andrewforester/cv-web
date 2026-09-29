import { useLayoutEffect, useRef } from 'react';
import { useStrings } from '../../i18n';
import type { ChatTurn } from './ChatUiState';
import styles from './MessageList.module.css';
import { MessageRow } from './MessageRow';
import { NoticeRow } from './NoticeRow';
import { chatStrings } from './strings';
import { SuggestedQuestions } from './SuggestedQuestions';
import { chatTestIds } from './testIds';
import { TurnView } from './TurnView';

/** While streaming, the list follows the answer only if the visitor is this close to the bottom. */
const FOLLOW_THRESHOLD_PX = 48;

interface MessageListProps {
  className?: string;
  turns: readonly ChatTurn[];
  conversationFull: boolean;
  maxInputLength: number;
  onAsk: (question: string) => void;
  onRetry: () => void;
  onNewChat: () => void;
}

/** The scrollable conversation: greeting, suggestions (empty state), turns, limit notice. */
export function MessageList({
  className,
  turns,
  conversationFull,
  maxInputLength,
  onAsk,
  onRetry,
  onNewChat,
}: MessageListProps) {
  const strings = useStrings(chatStrings);
  const listRef = useRef<HTMLOListElement>(null);
  const nearBottom = useRef(true);
  const lastTurnId = useRef<string | undefined>(undefined);

  // A new question always scrolls down; a growing answer only while the visitor is at the bottom.
  useLayoutEffect(() => {
    const list = listRef.current;
    const newestId = turns.at(-1)?.id;
    const newTurn = newestId !== lastTurnId.current;
    lastTurnId.current = newestId;
    if (list && (newTurn || nearBottom.current)) list.scrollTop = list.scrollHeight;
  }, [turns, conversationFull]);

  const onScroll = () => {
    const list = listRef.current;
    if (!list) return;
    nearBottom.current =
      list.scrollHeight - list.scrollTop - list.clientHeight <= FOLLOW_THRESHOLD_PX;
  };

  return (
    <ol
      ref={listRef}
      className={className ? `${styles.list} ${className}` : styles.list}
      aria-label={strings.listLabel}
      tabIndex={0}
      data-testid={chatTestIds.list}
      onScroll={onScroll}
    >
      <MessageRow author="assistant">
        <p>{strings.greeting}</p>
      </MessageRow>
      {turns.length === 0 && (
        <li>
          <SuggestedQuestions onAsk={onAsk} />
        </li>
      )}
      {turns.map((turn, index) => (
        <TurnView
          key={turn.id}
          turn={turn}
          isLast={index === turns.length - 1}
          maxInputLength={maxInputLength}
          onRetry={onRetry}
          onNewChat={onNewChat}
        />
      ))}
      {conversationFull && turns.length > 0 && (
        <NoticeRow
          text={strings.conversationLimit}
          tone="neutral"
          action={{ label: strings.newChat, testId: chatTestIds.newChat, onClick: onNewChat }}
        />
      )}
    </ol>
  );
}
