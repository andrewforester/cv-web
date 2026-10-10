import type { AgentPageStateV4, ChatError, ChatStopReason } from '../../data/chat';
import type { ChatActionCall, ChatEntry, ChatToolRound, ChatTurn } from './ChatUiState';
import { callReducer, startCall, type CallAction } from './voice/callReducer';

export type ConversationAction =
  | { type: 'ask'; id: string; question: string; page: AgentPageStateV4 }
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
  | { type: 'reset' }
  | CallAction;

type TurnAction = Exclude<ConversationAction, CallAction | { type: 'ask' | 'reset' }>;

const isTurn = (entry: ChatEntry): entry is ChatTurn => entry.kind === 'turn';

const isActive = (turn: ChatTurn) =>
  turn.status === 'pending' || turn.status === 'streaming' || turn.status === 'acting';

/**
 * Pure transitions of the conversation (text turns and voice calls, in order); events for a turn
 * that is no longer active, or a call that has ended, are ignored.
 */
export function conversationReducer(
  entries: readonly ChatEntry[],
  action: ConversationAction,
): readonly ChatEntry[] {
  switch (action.type) {
    case 'reset':
      return [];
    case 'ask': {
      const { id, question, page } = action;
      const turn: ChatTurn = {
        kind: 'turn',
        id,
        question,
        page,
        rounds: [],
        answer: '',
        status: 'pending',
      };
      return [...entries, turn];
    }
    case 'callStart':
      return [...entries, startCall(action.id)];
    case 'callLine':
    case 'callCorrection':
    case 'callAction':
    case 'callActionPatch':
    case 'callEnd':
      return entries.map((entry) =>
        entry.kind === 'call' && entry.id === action.id ? callReducer(entry, action) : entry,
      );
    default:
      return entries.map((entry) =>
        isTurn(entry) && entry.id === action.id ? updateTurn(entry, action) : entry,
      );
  }
}

function updateTurn(turn: ChatTurn, action: TurnAction): ChatTurn {
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

/** The text turns of a conversation, without its voice calls. */
export function textTurns(entries: readonly ChatEntry[]): ChatTurn[] {
  return entries.filter(isTurn);
}

export function isBusy(entries: readonly ChatEntry[]): boolean {
  return textTurns(entries).some(isActive);
}
