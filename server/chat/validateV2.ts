import {
  CHAT_API_VERSION_V2,
  CHAT_LIMITS_V2,
  type AgentToolCall,
  type ChatLocale,
  type ChatMessageV2,
  type ChatPage,
} from '../../src/data/chat/contract.js';
import { chatError } from './errors.js';
import { rebuildAssistantTurn } from './providerState.js';
import {
  checkPage,
  checkToolCalls,
  checkToolResults,
  invalid,
  isRecord,
  tooLong,
  type ValidationResult,
} from './validateParts.js';

const nonEmpty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

/** A `user` message: a question with its page snapshot, or the results of `previousCalls`. */
function checkUser(
  item: Record<string, unknown>,
  where: string,
  previousCalls: AgentToolCall[] | undefined,
  chatPage: ChatPage,
): ChatMessageV2 | string {
  if (previousCalls) {
    if (item.content !== undefined) return `${where} must carry toolResults only`;
    const toolResults = checkToolResults(item.toolResults, previousCalls, where);
    return typeof toolResults === 'string' ? toolResults : { role: 'user', toolResults };
  }
  if (item.toolResults !== undefined) return `${where}.toolResults without preceding toolCalls`;
  if (!nonEmpty(item.content)) return `${where}.content must be a non-empty string`;
  const page = checkPage(item.page, where, chatPage);
  return typeof page === 'string' ? page : { role: 'user', content: item.content, page };
}

function checkAssistant(item: Record<string, unknown>, where: string): ChatMessageV2 | string {
  if (typeof item.content !== 'string') return `${where}.content must be a string`;
  if (item.toolCalls === undefined) {
    if (item.providerState !== undefined) return `${where}.providerState without toolCalls`;
    if (item.content.trim() === '') return `${where}.content must be a non-empty string`;
    return { role: 'assistant', content: item.content };
  }
  const toolCalls = checkToolCalls(item.toolCalls, where);
  if (typeof toolCalls === 'string') return toolCalls;
  const { providerState } = item;
  if (providerState !== undefined) {
    if (typeof providerState !== 'string') return `${where}.providerState must be a string`;
    if (providerState.length > CHAT_LIMITS_V2.maxProviderStateChars) {
      return `${where}.providerState exceeds ${CHAT_LIMITS_V2.maxProviderStateChars} characters`;
    }
  }
  const rebuilt = rebuildAssistantTurn(item.content, toolCalls, providerState);
  if (!rebuilt.ok) return `${where}: ${rebuilt.reason}`;
  return { role: 'assistant', content: item.content, toolCalls, providerState };
}

function checkSequence(raw: unknown[], page: ChatPage): ChatMessageV2[] | string {
  const messages: ChatMessageV2[] = [];
  for (const [index, item] of raw.entries()) {
    const where = `messages[${index}]`;
    if (!isRecord(item)) return `${where} must be an object`;
    const expected = index % 2 === 0 ? 'user' : 'assistant';
    if (item.role !== expected) return `${where}.role must be "${expected}"`;
    const previous = messages.at(-1);
    const previousCalls =
      previous?.role === 'assistant' ? (previous.toolCalls ?? undefined) : undefined;
    const message =
      expected === 'user'
        ? checkUser(item, where, previousCalls, page)
        : checkAssistant(item, where);
    if (typeof message === 'string') return message;
    messages.push(message);
  }
  if (messages.length % 2 === 0) return 'The last message must be from the user';
  return messages;
}

function checkLengths(messages: ChatMessageV2[]): ValidationResult | undefined {
  let total = 0;
  for (const [index, message] of messages.entries()) {
    if (!('content' in message)) continue;
    const max =
      message.role === 'user'
        ? CHAT_LIMITS_V2.maxUserMessageChars
        : CHAT_LIMITS_V2.maxAssistantMessageChars;
    if (message.content.length > max) {
      return tooLong(`messages[${index}].content exceeds ${max} characters`);
    }
    total += message.content.length;
  }
  if (total > CHAT_LIMITS_V2.maxTotalChars) {
    return tooLong(`messages exceed ${CHAT_LIMITS_V2.maxTotalChars} characters in total`);
  }
  return undefined;
}

/** Assistant `toolCalls` messages after the last question: the rounds of the current turn. */
export function toolRoundOf(messages: ChatMessageV2[]): number {
  let rounds = 0;
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index];
    if (message?.role === 'user' && 'content' in message) break;
    if (message?.role === 'assistant' && message.toolCalls) rounds++;
  }
  return rounds;
}

/**
 * Validates a v2 body (docs/chat/API.md → v2); `v`, `locale`, `page` and the array are checked.
 * `page` absent = the CV; it is kept in the result only when sent.
 */
export function validateV2(locale: ChatLocale, raw: unknown[], page?: ChatPage): ValidationResult {
  if (raw.length > CHAT_LIMITS_V2.maxMessages) {
    return {
      ok: false,
      error: chatError('conversation_limit', `More than ${CHAT_LIMITS_V2.maxMessages} messages`),
    };
  }
  const messages = checkSequence(raw, page ?? 'cv');
  if (typeof messages === 'string') return invalid(messages);
  const questions = messages.filter((m) => m.role === 'user' && 'content' in m).length;
  if (questions > CHAT_LIMITS_V2.maxUserQuestions) {
    return {
      ok: false,
      error: chatError(
        'conversation_limit',
        `More than ${CHAT_LIMITS_V2.maxUserQuestions} questions`,
      ),
    };
  }
  const toolRound = toolRoundOf(messages);
  if (toolRound > CHAT_LIMITS_V2.maxToolRoundsPerTurn) {
    return invalid(`More than ${CHAT_LIMITS_V2.maxToolRoundsPerTurn} tool rounds in one turn`);
  }
  return (
    checkLengths(messages) ?? {
      ok: true,
      request: {
        v: CHAT_API_VERSION_V2,
        locale,
        ...(page !== undefined ? { page } : {}),
        messages,
        toolRound,
      },
    }
  );
}
