import { buildCvPageToolSpecs, cvPageTargetIds } from '../../src/data/chat/agentTools.js';
import {
  AGENT_CHAT_LAYOUTS,
  AGENT_VIEWPORTS,
  CHAT_API_VERSION_V4,
  CHAT_LIMITS_V2,
  CV_SECTION_IDS,
  type AgentPageStateV4,
} from '../../src/data/chat/contract.js';
import { CV_PAGE } from './cvPageData.js';
import { invalid, isOneOf, isRecord, type ValidationResult } from './validateParts.js';
import { validateToolTurns } from './validateToolTurns.js';

/** The catalogue's targets and tool names (sorted): a snapshot may name only these. */
const TARGETS: readonly string[] = cvPageTargetIds(CV_PAGE);
const TOOL_NAMES = buildCvPageToolSpecs(CV_PAGE).map((spec) => spec.name);

/**
 * A v4 question's snapshot rebuilt from known fields only (enums, never free text), or an error
 * text. `route` and `locale` are not part of it (ignored if sent). Size is checked as sent.
 */
function checkPageV4(raw: unknown, where: string): AgentPageStateV4 | string {
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

/**
 * Validates a v4 body (docs/chat/API.md → v4) whose `v` is already checked: the one page's
 * snapshot and catalogue, otherwise v2's rules. `page` and `locale` are ignored if sent.
 */
export function validateV4(body: Record<string, unknown>): ValidationResult {
  if (!Array.isArray(body.messages)) return invalid('messages must be an array');
  if (body.messages.length === 0) return invalid('messages must not be empty');
  const turns = validateToolTurns<AgentPageStateV4>(body.messages, {
    checkPage: checkPageV4,
    toolNames: TOOL_NAMES,
  });
  if (!turns.ok) return turns;
  const { messages, toolRound } = turns;
  return { ok: true, request: { v: CHAT_API_VERSION_V4, messages, toolRound } };
}
