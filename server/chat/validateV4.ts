import { buildCvPageToolSpecs, cvPageTargetIds } from '../../src/data/chat/agentTools.js';
import {
  AGENT_CHAT_LAYOUTS,
  AGENT_VIEWPORTS,
  CHAT_API_VERSION_V4,
  CHAT_LIMITS_V2,
  CV_SECTION_IDS,
  type AgentPageStateV4,
  type AgentToolCall,
  type ChatAssistantMessageV2,
  type ChatError,
  type ChatMessageV4,
} from '../../src/data/chat/contract.js';
import { CV_PAGE } from './cvPageData.js';
import { chatError } from './errors.js';
import { rebuildAssistantTurn } from './providerState.js';
import {
  checkToolCalls,
  checkToolResults,
  invalid,
  isOneOf,
  isRecord,
  type ValidationResult,
} from './validateParts.js';

/** The catalogue's targets and tool names (sorted): a snapshot may name only these. */
const TARGETS: readonly string[] = cvPageTargetIds(CV_PAGE);
const TOOL_NAMES = buildCvPageToolSpecs(CV_PAGE).map((spec) => spec.name);

const nonEmpty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

/**
 * A question's snapshot rebuilt from known fields only (enums, never free text), or an error
 * text. `route` and `locale` are not part of it (ignored if sent). Size is checked as sent.
 */
function checkPage(raw: unknown, where: string): AgentPageStateV4 | string {
  if (!isRecord(raw)) return `${where}.page must be an object`;
  if (JSON.stringify(raw).length > CHAT_LIMITS_V2.maxPageStateChars) {
    return `${where}.page exceeds ${CHAT_LIMITS_V2.maxPageStateChars} characters`;
  }
  const { viewport, chat, activeSection, highlighted, tools } = raw;
  if (!isOneOf(AGENT_VIEWPORTS, viewport)) return `${where}.page.viewport is invalid`;
  if (!isOneOf(AGENT_CHAT_LAYOUTS, chat)) return `${where}.page.chat is invalid`;
  if (activeSection !== null && !isOneOf(CV_SECTION_IDS, activeSection)) {
    return `${where}.page.activeSection is invalid`;
  }
  if (highlighted !== null && !isOneOf(TARGETS, highlighted)) {
    return `${where}.page.highlighted is invalid`;
  }
  if (!Array.isArray(tools) || !tools.every((name) => isOneOf(TOOL_NAMES, name))) {
    return `${where}.page.tools must list the page's tool names`;
  }
  return {
    viewport,
    chat,
    activeSection,
    highlighted: highlighted as AgentPageStateV4['highlighted'],
    tools: [...new Set(tools)].sort(),
  };
}

/** A `user` message: a question with its page snapshot, or the results of `previousCalls`. */
function checkUser(
  item: Record<string, unknown>,
  where: string,
  previousCalls: AgentToolCall[] | undefined,
): ChatMessageV4 | string {
  if (previousCalls) {
    if (item.content !== undefined) return `${where} must carry toolResults only`;
    const toolResults = checkToolResults(item.toolResults, previousCalls, where);
    return typeof toolResults === 'string' ? toolResults : { role: 'user', toolResults };
  }
  if (item.toolResults !== undefined) return `${where}.toolResults without preceding toolCalls`;
  if (!nonEmpty(item.content)) return `${where}.content must be a non-empty string`;
  const page = checkPage(item.page, where);
  return typeof page === 'string' ? page : { role: 'user', content: item.content, page };
}

function checkAssistant(
  item: Record<string, unknown>,
  where: string,
): ChatAssistantMessageV2 | string {
  if (typeof item.content !== 'string') return `${where}.content must be a string`;
  if (item.toolCalls === undefined) {
    if (item.providerState !== undefined) return `${where}.providerState without toolCalls`;
    if (item.content.trim() === '') return `${where}.content must be a non-empty string`;
    return { role: 'assistant', content: item.content };
  }
  const toolCalls = checkToolCalls(item.toolCalls, where, TOOL_NAMES);
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

/** Alternation (even index: user), each message's shape, and a `user` message at the end. */
function checkSequence(raw: unknown[]): ChatMessageV4[] | string {
  const messages: ChatMessageV4[] = [];
  for (const [index, item] of raw.entries()) {
    const where = `messages[${index}]`;
    if (!isRecord(item)) return `${where} must be an object`;
    const expected = index % 2 === 0 ? 'user' : 'assistant';
    if (item.role !== expected) return `${where}.role must be "${expected}"`;
    const previous = messages.at(-1);
    const previousCalls =
      previous?.role === 'assistant' ? (previous.toolCalls ?? undefined) : undefined;
    const message =
      expected === 'user' ? checkUser(item, where, previousCalls) : checkAssistant(item, where);
    if (typeof message === 'string') return message;
    messages.push(message);
  }
  if (messages.length % 2 === 0) return 'The last message must be from the user';
  return messages;
}

function lengthError(messages: ChatMessageV4[]): ChatError | undefined {
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
function toolRoundOf(messages: ChatMessageV4[]): number {
  let rounds = 0;
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index];
    if (message?.role === 'user' && 'content' in message) break;
    if (message?.role === 'assistant' && message.toolCalls) rounds++;
  }
  return rounds;
}

/**
 * Validates a v4 body (docs/chat/API.md → v4) whose `v` is already checked: conversation limits,
 * alternation, questions with the one page's snapshot, tool calls and results from its catalogue,
 * lengths, and the turn's tool round. `page` and `locale` are ignored if sent.
 */
export function validateV4(body: Record<string, unknown>): ValidationResult {
  const raw = body.messages;
  if (!Array.isArray(raw)) return invalid('messages must be an array');
  if (raw.length === 0) return invalid('messages must not be empty');
  if (raw.length > CHAT_LIMITS_V2.maxMessages) {
    const message = `More than ${CHAT_LIMITS_V2.maxMessages} messages`;
    return { ok: false, error: chatError('conversation_limit', message) };
  }
  const messages = checkSequence(raw);
  if (typeof messages === 'string') return invalid(messages);
  const questions = messages.filter((m) => m.role === 'user' && 'content' in m).length;
  if (questions > CHAT_LIMITS_V2.maxUserQuestions) {
    const message = `More than ${CHAT_LIMITS_V2.maxUserQuestions} questions`;
    return { ok: false, error: chatError('conversation_limit', message) };
  }
  const toolRound = toolRoundOf(messages);
  if (toolRound > CHAT_LIMITS_V2.maxToolRoundsPerTurn) {
    return invalid(`More than ${CHAT_LIMITS_V2.maxToolRoundsPerTurn} tool rounds in one turn`);
  }
  const error = lengthError(messages);
  if (error) return { ok: false, error };
  return { ok: true, request: { v: CHAT_API_VERSION_V4, messages, toolRound } };
}
