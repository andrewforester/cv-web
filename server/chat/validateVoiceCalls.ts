import {
  CHAT_LIMITS_V2,
  type ChatError,
  type ChatVoiceCallV4,
  type ChatVoiceLineV4,
} from '../../src/data/chat/contract.js';
import { chatError } from './errors.js';
import { isOneOf, isRecord, nonEmpty } from './validateParts.js';

const VOICE_LINE_ROLES = ['visitor', 'agent'] as const;

/**
 * The voice calls a v4 question carries (docs/chat/API.md → Voice calls in the history), rebuilt
 * from `role` and `text` only (other fields dropped), or an error text (`invalid_request`). The
 * char caps (`too_long`) are `voiceChars`', checked with the other lengths.
 */
export function checkVoiceCalls(raw: unknown, where: string): ChatVoiceCallV4[] | string {
  const { maxVoiceCallsPerQuestion, maxVoiceCallLines } = CHAT_LIMITS_V2;
  if (!Array.isArray(raw) || raw.length === 0) {
    return `${where}.voiceCalls must be a non-empty array`;
  }
  if (raw.length > maxVoiceCallsPerQuestion) {
    return `${where}.voiceCalls has more than ${maxVoiceCallsPerQuestion} calls`;
  }
  const calls: ChatVoiceCallV4[] = [];
  for (const [index, call] of raw.entries()) {
    const at = `${where}.voiceCalls[${index}]`;
    if (!isRecord(call) || !Array.isArray(call.lines) || call.lines.length === 0) {
      return `${at}.lines must be a non-empty array`;
    }
    if (call.lines.length > maxVoiceCallLines) {
      return `${at}.lines has more than ${maxVoiceCallLines} lines`;
    }
    const lines: ChatVoiceLineV4[] = [];
    for (const [lineIndex, line] of call.lines.entries()) {
      if (!isRecord(line) || !isOneOf(VOICE_LINE_ROLES, line.role) || !nonEmpty(line.text)) {
        return `${at}.lines[${lineIndex}] must be { role: "visitor" | "agent", text }`;
      }
      lines.push({ role: line.role, text: line.text });
    }
    calls.push({ lines });
  }
  return calls;
}

/** A question's voice text (all line `text`), or the error of the first line or call too long. */
export function voiceChars(calls: ChatVoiceCallV4[], where: string): number | ChatError {
  const { maxVoiceLineChars, maxVoiceCallChars } = CHAT_LIMITS_V2;
  let total = 0;
  for (const [index, call] of calls.entries()) {
    const at = `${where}.voiceCalls[${index}]`;
    let callChars = 0;
    for (const [lineIndex, line] of call.lines.entries()) {
      if (line.text.length > maxVoiceLineChars) {
        return chatError(
          'too_long',
          `${at}.lines[${lineIndex}] exceeds ${maxVoiceLineChars} characters`,
        );
      }
      callChars += line.text.length;
    }
    if (callChars > maxVoiceCallChars) {
      return chatError('too_long', `${at} exceeds ${maxVoiceCallChars} characters`);
    }
    total += callChars;
  }
  return total;
}
