import {
  CHAT_LIMITS_V2,
  type AgentPageState,
  type ChatError,
  type ChatMessageV2,
  type ChatStopReason,
} from '../../data/chat';
import type { ChatActionCall, ChatToolRound, ChatTurn } from './ChatUiState';

export type ConversationAction =
  | { type: 'ask'; id: string; question: string; page: AgentPageState }
  | { type: 'retry'; id: string }
  | { type: 'delta'; id: string; text: string }
  /** The model message ended in tool calls: the streamed text and these calls become a round. */
  | { type: 'round'; id: string; providerState?: string; actions: ChatActionCall[] }
  | { type: 'action'; id: string; callId: string; patch: Partial<ChatActionCall> }
  /** All calls of the last round have results; the follow-up request is on its way. */
  | { type: 'resume'; id: string }
  | { type: 'done'; id: string; stopReason: ChatStopReason }
  | { type: 'stop'; id: string }
  | { type: 'fail'; id: string; error: ChatError }
  | { type: 'reset' };

const isActive = (turn: ChatTurn) =>
  turn.status === 'pending' || turn.status === 'streaming' || turn.status === 'acting';

/** Pure transitions of the conversation; events for a turn that is no longer active are ignored. */
export function conversationReducer(
  turns: readonly ChatTurn[],
  action: ConversationAction,
): readonly ChatTurn[] {
  if (action.type === 'reset') return [];
  if (action.type === 'ask') {
    const { id, question, page } = action;
    return [...turns, { id, question, page, rounds: [], answer: '', status: 'pending' }];
  }
  return turns.map((turn) => (turn.id === action.id ? updateTurn(turn, action) : turn));
}

function updateTurn(
  turn: ChatTurn,
  action: Exclude<ConversationAction, { type: 'ask' | 'reset' }>,
): ChatTurn {
  if (action.type === 'retry') {
    // Finished rounds stay: the retry continues after them and never runs their tools again.
    return turn.status === 'error'
      ? { ...turn, answer: '', status: 'pending', error: undefined }
      : turn;
  }
  if (!isActive(turn)) return turn;
  switch (action.type) {
    case 'delta':
      return { ...turn, answer: turn.answer + action.text, status: 'streaming' };
    case 'round': {
      const round: ChatToolRound = {
        text: turn.answer,
        providerState: action.providerState,
        actions: action.actions,
      };
      return { ...turn, rounds: [...turn.rounds, round], answer: '', status: 'acting' };
    }
    case 'action':
      return { ...turn, rounds: updateLastRound(turn.rounds, action.callId, action.patch) };
    case 'resume':
      return turn.status === 'acting' ? { ...turn, status: 'pending' } : turn;
    case 'done':
      return { ...turn, status: 'done', stopReason: action.stopReason };
    case 'stop':
      return { ...turn, status: 'stopped' };
    case 'fail':
      return { ...turn, status: 'error', error: action.error };
  }
}

function updateLastRound(
  rounds: readonly ChatToolRound[],
  callId: string,
  patch: Partial<ChatActionCall>,
): readonly ChatToolRound[] {
  const last = rounds.at(-1);
  if (!last) return rounds;
  const actions = last.actions.map((item) =>
    item.call.id === callId ? { ...item, ...patch } : item,
  );
  return [...rounds.slice(0, -1), { ...last, actions }];
}

export function isBusy(turns: readonly ChatTurn[]): boolean {
  return turns.some(isActive);
}

/** The model messages of a turn's tool rounds: the assistant message, then its results. */
function roundMessages(rounds: readonly ChatToolRound[]): ChatMessageV2[] {
  return rounds.flatMap((round): ChatMessageV2[] => [
    {
      role: 'assistant',
      content: round.text,
      toolCalls: round.actions.map((item) => item.call),
      ...(round.providerState !== undefined && { providerState: round.providerState }),
    },
    {
      role: 'user',
      toolResults: round.actions.map((item) => ({
        callId: item.call.id,
        result: item.result ?? { ok: false, error: 'failed' },
      })),
    },
  ]);
}

/** The question with its page snapshot and the finished tool rounds: what a retry re-sends. */
export function turnMessages(turn: ChatTurn): ChatMessageV2[] {
  return [{ role: 'user', content: turn.question, page: turn.page }, ...roundMessages(turn.rounds)];
}

/**
 * The history to send: completed turns only (a `done` answer with text, exactly as streamed, after
 * its tool rounds; stopped and failed turns are dropped with their question so roles keep
 * alternating).
 */
export function buildHistory(history: readonly ChatTurn[]): ChatMessageV2[] {
  return history
    .filter((turn) => turn.status === 'done' && turn.answer.trim() !== '')
    .flatMap((turn) => [
      ...turnMessages(turn),
      { role: 'assistant' as const, content: turn.answer },
    ]);
}

export function buildMessages(
  history: readonly ChatTurn[],
  question: string,
  page: AgentPageState,
): ChatMessageV2[] {
  return [...buildHistory(history), { role: 'user', content: question, page }];
}

/** Whether sending `question` after `history` would break the API's conversation limits. */
export function exceedsConversationLimits(history: readonly ChatTurn[], question: string): boolean {
  const messages = buildHistory(history);
  const questions = messages.filter((message) => 'page' in message).length + 1;
  const chars = messages.reduce(
    (sum, message) => sum + ('content' in message ? message.content.length : 0),
    question.length,
  );
  return (
    messages.length + 1 > CHAT_LIMITS_V2.maxMessages ||
    questions > CHAT_LIMITS_V2.maxUserQuestions ||
    chars > CHAT_LIMITS_V2.maxTotalChars
  );
}
