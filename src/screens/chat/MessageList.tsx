import { useLayoutEffect, useRef } from 'react';
import { useStrings } from '../../i18n';
import type { ChatEntry } from './ChatUiState';
import styles from './MessageList.module.css';
import { MessageRow } from './MessageRow';
import { NoticeRow } from './NoticeRow';
import { chatStrings } from './strings';
import { SuggestedQuestions } from './SuggestedQuestions';
import { chatTestIds } from './testIds';
import { TurnView } from './TurnView';
import { VoiceCallView } from './voice/VoiceCallView';

/** While streaming, the list follows the answer only if the visitor is this close to the bottom. */
const FOLLOW_THRESHOLD_PX = 48;

interface MessageListProps {
  className?: string;
  /** The assistant's first message on this page. */
  greeting: string;
  /** Text turns and voice calls, in order. */
  entries: readonly ChatEntry[];
  conversationFull: boolean;
  suggestions: readonly string[];
  commands: readonly string[];
  maxInputLength: number;
  onAsk: (question: string) => void;
  onRetry: () => void;
  onNewChat: () => void;
  onConfirmAction: (callId: string) => void;
  onDeclineAction: (callId: string) => void;
}

/** The scrollable conversation: greeting, suggestions (empty state), turns and calls, limit notice. */
export function MessageList({
  className,
  greeting,
  entries,
  conversationFull,
  suggestions,
  commands,
  maxInputLength,
  onAsk,
  onRetry,
  onNewChat,
  onConfirmAction,
  onDeclineAction,
}: MessageListProps) {
  const strings = useStrings(chatStrings);
  const listRef = useRef<HTMLOListElement>(null);
  const nearBottom = useRef(true);
  const lastEntryId = useRef<string | undefined>(undefined);

  // A new question or call always scrolls down; a growing answer only while the visitor is at the
  // bottom. The empty state (taller than the list) opens at its top, on the greeting.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (entries.length === 0) {
      list.scrollTop = 0;
      return;
    }
    const newestId = entries.at(-1)?.id;
    const newEntry = newestId !== lastEntryId.current;
    lastEntryId.current = newestId;
    if (newEntry || nearBottom.current) list.scrollTop = list.scrollHeight;
  }, [entries, conversationFull]);

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
        <p>{greeting}</p>
      </MessageRow>
      {entries.length === 0 && (
        <li>
          <SuggestedQuestions suggestions={suggestions} commands={commands} onAsk={onAsk} />
        </li>
      )}
      {entries.map((entry, index) =>
        entry.kind === 'call' ? (
          <VoiceCallView key={entry.id} call={entry} />
        ) : (
          <TurnView
            key={entry.id}
            turn={entry}
            isLast={index === entries.length - 1}
            maxInputLength={maxInputLength}
            onRetry={onRetry}
            onNewChat={onNewChat}
            onConfirmAction={onConfirmAction}
            onDeclineAction={onDeclineAction}
          />
        ),
      )}
      {conversationFull && entries.length > 0 && (
        <NoticeRow
          text={strings.conversationLimit}
          tone="neutral"
          action={{ label: strings.newChat, testId: chatTestIds.newChat, onClick: onNewChat }}
        />
      )}
    </ol>
  );
}
