import {
  CHAT_LIMITS_V2,
  type AgentToolCall,
  type AgentToolName,
  type ChatAssistantMessageV2,
  type ChatError,
  type ChatToolResultsMessageV2,
} from '../../src/data/chat/contract.js';
import { chatError } from './errors.js';
import { rebuildAssistantTurn } from './providerState.js';
import { checkToolCalls, checkToolResults, isRecord } from './validateParts.js';

/** A message of the tool dialect (v2, v4): they differ only in the question's page snapshot. */
export type ToolDialectMessage<P> =
  { role: 'user'; content: string; page: P } | ChatToolResultsMessageV2 | ChatAssistantMessageV2;

/** What a version decides: its snapshot shape and its catalogue's tool names. */
export interface ToolDialectRules<P> {
  /** The question's snapshot rebuilt from known fields, or an error text. */
  checkPage: (raw: unknown, where: string) => P | string;
  toolNames: readonly AgentToolName[];
}

export type ToolTurns<P> =
  | { ok: true; messages: ToolDialectMessage<P>[]; toolRound: number }
  | { ok: false; error: ChatError };

const nonEmpty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

/** A `user` message: a question with its page snapshot, or the results of `previousCalls`. */
function checkUser<P>(
  item: Record<string, unknown>,
  where: string,
  previousCalls: AgentToolCall[] | undefined,
  rules: ToolDialectRules<P>,
): ToolDialectMessage<P> | string {
  if (previousCalls) {
    if (item.content !== undefined) return `${where} must carry toolResults only`;
    const toolResults = checkToolResults(item.toolResults, previousCalls, where);
    return typeof toolResults === 'string' ? toolResults : { role: 'user', toolResults };
  }
  if (item.toolResults !== undefined) return `${where}.toolResults without preceding toolCalls`;
  if (!nonEmpty(item.content)) return `${where}.content must be a non-empty string`;
  const page = rules.checkPage(item.page, where);
  return typeof page === 'string' ? page : { role: 'user', content: item.content, page };
}

function checkAssistant(
  item: Record<string, unknown>,
  where: string,
  toolNames: readonly AgentToolName[],
): ChatAssistantMessageV2 | string {
  if (typeof item.content !== 'string') return `${where}.content must be a string`;
  if (item.toolCalls === undefined) {
    if (item.providerState !== undefined) return `${where}.providerState without toolCalls`;
    if (item.content.trim() === '') return `${where}.content must be a non-empty string`;
    return { role: 'assistant', content: item.content };
  }
  const toolCalls = checkToolCalls(item.toolCalls, where, toolNames);
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

function checkSequence<P>(
  raw: unknown[],
  rules: ToolDialectRules<P>,
): ToolDialectMessage<P>[] | string {
  const messages: ToolDialectMessage<P>[] = [];
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
        ? checkUser(item, where, previousCalls, rules)
        : checkAssistant(item, where, rules.toolNames);
    if (typeof message === 'string') return message;
    messages.push(message);
  }
  if (messages.length % 2 === 0) return 'The last message must be from the user';
  return messages;
}

function lengthError<P>(messages: ToolDialectMessage<P>[]): ChatError | undefined {
  let total = 0;
  for (const [index, message] of messages.entries()) {
    if (!('content' in message)) continue;
    const max =
      message.role === 'user'
        ? CHAT_LIMITS_V2.maxUserMessageChars
        : CHAT_LIMITS_V2.maxAssistantMessageChars;
    if (message.content.length > max) {
      return chatError('too_long', `messages[${index}].content exceeds ${max} characters`);
    }
    total += message.content.length;
  }
  if (total > CHAT_LIMITS_V2.maxTotalChars) {
    return chatError(
      'too_long',
      `messages exceed ${CHAT_LIMITS_V2.maxTotalChars} characters in total`,
    );
  }
  return undefined;
}

/** Assistant `toolCalls` messages after the last question: the rounds of the current turn. */
export function toolRoundOf<P>(messages: ToolDialectMessage<P>[]): number {
  let rounds = 0;
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index];
    if (message?.role === 'user' && 'content' in message) break;
    if (message?.role === 'assistant' && message.toolCalls) rounds++;
  }
  return rounds;
}

/**
 * The tool dialect's messages (docs/chat/API.md → v2, v4): conversation limits, alternation,
 * questions with their snapshot, tool calls and results, lengths, and the turn's tool round.
 */
export function validateToolTurns<P>(raw: unknown[], rules: ToolDialectRules<P>): ToolTurns<P> {
  if (raw.length > CHAT_LIMITS_V2.maxMessages) {
    const error = chatError(
      'conversation_limit',
      `More than ${CHAT_LIMITS_V2.maxMessages} messages`,
    );
    return { ok: false, error };
  }
  const messages = checkSequence(raw, rules);
  if (typeof messages === 'string') {
    return { ok: false, error: chatError('invalid_request', messages) };
  }
  const questions = messages.filter((m) => m.role === 'user' && 'content' in m).length;
  if (questions > CHAT_LIMITS_V2.maxUserQuestions) {
    const message = `More than ${CHAT_LIMITS_V2.maxUserQuestions} questions`;
    return { ok: false, error: chatError('conversation_limit', message) };
  }
  const toolRound = toolRoundOf(messages);
  if (toolRound > CHAT_LIMITS_V2.maxToolRoundsPerTurn) {
    const message = `More than ${CHAT_LIMITS_V2.maxToolRoundsPerTurn} tool rounds in one turn`;
    return { ok: false, error: chatError('invalid_request', message) };
  }
  const error = lengthError(messages);
  return error ? { ok: false, error } : { ok: true, messages, toolRound };
}
