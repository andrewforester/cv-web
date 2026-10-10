import { ActionChip } from './ActionChip';
import { AnswerText } from './AnswerText';
import type { ChatToolRound } from './ChatUiState';
import { ConfirmationCard } from './ConfirmationCard';
import { MessageRow } from './MessageRow';
import styles from './RoundView.module.css';
import { chatTestIds } from './testIds';

interface RoundViewProps {
  round: ChatToolRound;
  onConfirm: (callId: string) => void;
  onDecline: (callId: string) => void;
}

/** A model message that ended in tool calls: what it said, then a chip or card per call. */
export function RoundView({ round, onConfirm, onDecline }: RoundViewProps) {
  return (
    <>
      {round.text.trim() !== '' && (
        <MessageRow author="assistant" testId={chatTestIds.assistantMessage}>
          <AnswerText text={round.text} caret={false} />
        </MessageRow>
      )}
      <li className={styles.actions}>
        {round.actions.map((action) =>
          action.status === 'awaiting' ? (
            <ConfirmationCard
              key={action.call.id}
              action={action}
              onConfirm={onConfirm}
              onDecline={onDecline}
            />
          ) : (
            <ActionChip key={action.call.id} action={action} />
          ),
        )}
      </li>
    </>
  );
}
