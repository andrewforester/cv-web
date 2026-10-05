import {
  AGENT_TOOL_NAMES,
  CHAT_API_VERSION_V2,
  type AgentPageState,
  type ChatLocale,
  type ChatPage,
} from '../../src/data/chat/contract.js';
import { checkPage, type ValidationResult } from './validateParts.js';
import { validateToolTurns } from './validateToolTurns.js';

/**
 * Validates a v2 body (docs/chat/API.md → v2); `v`, `locale`, `page` and the array are checked.
 * `page` absent = the CV; the result always carries the resolved page.
 */
export function validateV2(
  locale: ChatLocale,
  raw: unknown[],
  page: ChatPage = 'cv',
): ValidationResult {
  const turns = validateToolTurns<AgentPageState>(raw, {
    checkPage: (snapshot, where) => checkPage(snapshot, where, page),
    toolNames: AGENT_TOOL_NAMES,
  });
  if (!turns.ok) return turns;
  const { messages, toolRound } = turns;
  return { ok: true, request: { v: CHAT_API_VERSION_V2, locale, page, messages, toolRound } };
}
