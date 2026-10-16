import {
  CHAT_LIMITS_V2,
  type AgentPageStateV4,
  type ChatMessageV4,
  type ChatUserMessageV4,
} from '../../data/chat';
import type { ChatEntry, ChatToolRound, ChatTurn } from './ChatUiState';
import type { ChatVoiceCall } from './voice/callReducer';
import { questionVoiceCalls, voiceCallChars } from './voice/voiceHistory';

/*
 * What the conversation sends to `/api/chat` (API.md → v4): the history of answered turns, each
 * question with the voice calls before it, and the conversation limits checked before sending.
 */

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
