import {
  CHAT_LIMITS_V2,
  type AgentPageStateV4,
  type ChatError,
  type ChatMessageV4,
  type ChatStopReason,
  type ChatUserMessageV4,
} from '../../data/chat';
import type { ChatActionCall, ChatEntry, ChatToolRound, ChatTurn } from './ChatUiState';
import { callReducer, startCall, type CallAction, type ChatVoiceCall } from './voice/callReducer';
import { questionVoiceCalls, voiceCallChars } from './voice/voiceHistory';

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

/** The model messages of a turn's tool rounds: the assistant message, then its results. */
function roundMessages(rounds: readonly ChatToolRound[]): ChatMessageV4[] {
  return rounds.flatMap((round): ChatMessageV4[] => [
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

/** A question with its page snapshot and the voice calls before it (omitted when none). */
function questionMessage(
  content: string,
  page: AgentPageStateV4,
  calls: readonly ChatVoiceCall[],
): ChatUserMessageV4 {
  const voiceCalls = questionVoiceCalls(calls);
  return { role: 'user', content, page, ...(voiceCalls.length > 0 && { voiceCalls }) };
}

/** A turn's messages: its question (with the voice calls before it), then its finished rounds. */
export function turnMessages(
  turn: ChatTurn,
  callsBefore: readonly ChatVoiceCall[] = [],
): ChatMessageV4[] {
  return [questionMessage(turn.question, turn.page, callsBefore), ...roundMessages(turn.rounds)];
}

/** A turn the text model is sent in later requests: `done`, with an answer. */
export const isAnswered = (turn: ChatTurn) => turn.status === 'done' && turn.answer.trim() !== '';

/**
 * The history to send, and the voice calls after its last question (they go with the next one).
 * Completed turns only (a `done` answer with text, exactly as streamed, after its tool rounds;
 * stopped and failed turns are dropped with their question so roles keep alternating). Each
 * question carries the voice calls since the previous question sent, so calls before a dropped
 * turn move on to the next (docs/voice/SYSTEM_DESIGN.md §8).
 */
function sentHistory(history: readonly ChatEntry[]): {
  messages: ChatMessageV4[];
  callsAfter: ChatVoiceCall[];
} {
  const messages: ChatMessageV4[] = [];
  let calls: ChatVoiceCall[] = [];
  for (const entry of history) {
    if (entry.kind === 'call') {
      calls.push(entry);
    } else if (isAnswered(entry)) {
      messages.push(...turnMessages(entry, calls), { role: 'assistant', content: entry.answer });
      calls = [];
    }
  }
  return { messages, callsAfter: calls };
}

export function buildHistory(history: readonly ChatEntry[]): ChatMessageV4[] {
  return sentHistory(history).messages;
}

export function buildMessages(
  history: readonly ChatEntry[],
  question: string,
  page: AgentPageStateV4,
): ChatMessageV4[] {
  const { messages, callsAfter } = sentHistory(history);
  return [...messages, questionMessage(question, page, callsAfter)];
}

/**
 * What Try again sends for a failed turn: the history before it, then its question with the same
 * voice calls as the first attempt, and its finished tool rounds.
 * TODO(CV-186): `useChatConversation`'s `retry` sends this instead of building the list itself.
 */
export function retryMessages(before: readonly ChatEntry[], failed: ChatTurn): ChatMessageV4[] {
  const { messages, callsAfter } = sentHistory(before);
  return [...messages, ...turnMessages(failed, callsAfter)];
}

/** A message's chars toward `maxTotalChars`: its text plus the voice lines it carries. */
function messageChars(message: ChatMessageV4): number {
  if (!('content' in message)) return 0;
  const voice = 'voiceCalls' in message ? voiceCallChars(message.voiceCalls ?? []) : 0;
  return message.content.length + voice;
}

/** Whether sending `question` after `history` would break the API's conversation limits. */
export function exceedsConversationLimits(
  history: readonly ChatEntry[],
  question: string,
): boolean {
  const { messages, callsAfter } = sentHistory(history);
  const questions = messages.filter((message) => 'page' in message).length + 1;
  const chars = messages.reduce(
    (sum, message) => sum + messageChars(message),
    question.length + voiceCallChars(questionVoiceCalls(callsAfter)),
  );
  return (
    messages.length + 1 > CHAT_LIMITS_V2.maxMessages ||
    questions > CHAT_LIMITS_V2.maxUserQuestions ||
    chars > CHAT_LIMITS_V2.maxTotalChars
  );
}
