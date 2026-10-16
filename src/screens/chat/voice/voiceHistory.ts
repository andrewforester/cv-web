import { CHAT_LIMITS_V2, type ChatVoiceCallV4, type ChatVoiceLineV4 } from '../../../data/chat';
import type { ChatVoiceCall, ChatVoiceLine } from './callReducer';

/** A call's final lines with text, in spoken order (its tool chips left out). */
export function spokenLines(call: ChatVoiceCall): ChatVoiceLine[] {
  return call.items.filter(
    (item): item is ChatVoiceLine => item.kind === 'line' && item.text.trim() !== '',
  );
}

/**
 * The calls a question carries to the text model (docs/chat/API.md → Voice calls in the history),
 * cut to the API's caps so a request is never refused for them: calls without lines are left
 * out, the latest `maxVoiceCallsPerQuestion` are kept, and of each call its last lines within
 * `maxVoiceCallLines` and `maxVoiceCallChars`, each cut at `maxVoiceLineChars`.
 */
export function questionVoiceCalls(calls: readonly ChatVoiceCall[]): ChatVoiceCallV4[] {
  return calls
    .map(callTranscript)
    .filter((lines) => lines.length > 0)
    .slice(-CHAT_LIMITS_V2.maxVoiceCallsPerQuestion)
    .map((lines) => ({ lines }));
}

/** All line text of the calls: what they add to the conversation's char total. */
export function voiceCallChars(calls: readonly ChatVoiceCallV4[]): number {
  return calls.reduce(
    (sum, call) => call.lines.reduce((callSum, line) => callSum + line.text.length, sum),
    0,
  );
}

function callTranscript(call: ChatVoiceCall): ChatVoiceLineV4[] {
  const { maxVoiceCallLines, maxVoiceCallChars, maxVoiceLineChars } = CHAT_LIMITS_V2;
  const lines = spokenLines(call).map(({ role, text }) => ({
    role,
    text: text.trim().slice(0, maxVoiceLineChars),
  }));
  let first = lines.length;
  let chars = 0;
  while (first > 0 && lines.length - first < maxVoiceCallLines) {
    const length = lines[first - 1]?.text.length ?? 0;
    if (chars + length > maxVoiceCallChars) break;
    chars += length;
    first -= 1;
  }
  return lines.slice(first);
}
