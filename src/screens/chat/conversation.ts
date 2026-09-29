import {
  CHAT_LIMITS,
  type ChatError,
  type ChatMessage,
  type ChatStopReason,
} from '../../data/chat';
import type { ChatTurn } from './ChatUiState';

export type ConversationAction =
  | { type: 'ask'; id: string; question: string }
  | { type: 'retry'; id: string }
  | { type: 'delta'; id: string; text: string }
  | { type: 'done'; id: string; stopReason: ChatStopReason }
  | { type: 'stop'; id: string }
  | { type: 'fail'; id: string; error: ChatError }
  | { type: 'reset' };

const isActive = (turn: ChatTurn) => turn.status === 'pending' || turn.status === 'streaming';

/** Pure transitions of the conversation; events for a turn that is no longer active are ignored. */
export function conversationReducer(
  turns: readonly ChatTurn[],
  action: ConversationAction,
): readonly ChatTurn[] {
  if (action.type === 'reset') return [];
  if (action.type === 'ask') {
    return [...turns, { id: action.id, question: action.question, answer: '', status: 'pending' }];
  }
  return turns.map((turn) => (turn.id === action.id ? updateTurn(turn, action) : turn));
}

function updateTurn(
  turn: ChatTurn,
  action: Exclude<ConversationAction, { type: 'ask' | 'reset' }>,
) {
  if (action.type === 'retry') {
    return turn.status === 'error'
      ? { ...turn, answer: '', status: 'pending' as const, error: undefined }
      : turn;
  }
  if (!isActive(turn)) return turn;
  switch (action.type) {
    case 'delta':
      return { ...turn, answer: turn.answer + action.text, status: 'streaming' as const };
    case 'done':
      return { ...turn, status: 'done' as const, stopReason: action.stopReason };
    case 'stop':
      return { ...turn, status: 'stopped' as const };
    case 'fail':
      return { ...turn, status: 'error' as const, error: action.error };
  }
}

export function isBusy(turns: readonly ChatTurn[]): boolean {
  return turns.some(isActive);
}

/**
 * The messages to send: completed turns only (a `done` answer with text, exactly as streamed;
 * stopped and failed turns are dropped with their question so roles keep alternating), then the
 * new question.
 */
export function buildMessages(history: readonly ChatTurn[], question: string): ChatMessage[] {
  const messages: ChatMessage[] = [];
  for (const turn of history) {
    if (turn.status !== 'done' || turn.answer.trim() === '') continue;
    messages.push(
      { role: 'user', content: turn.question },
      { role: 'assistant', content: turn.answer },
    );
  }
  messages.push({ role: 'user', content: question });
  return messages;
}

/** Whether sending `question` after `history` would break the API's conversation limits. */
export function exceedsConversationLimits(history: readonly ChatTurn[], question: string): boolean {
  const messages = buildMessages(history, question);
  const chars = messages.reduce((sum, message) => sum + message.content.length, 0);
  return messages.length > CHAT_LIMITS.maxMessages || chars > CHAT_LIMITS.maxTotalChars;
}
