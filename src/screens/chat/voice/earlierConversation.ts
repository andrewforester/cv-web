import { EARLIER_CONVERSATION_HEADING, EARLIER_CONVERSATION_LIMITS } from '../../../data/voice';
import type { ChatEntry } from '../ChatUiState';
import { isAnswered } from '../conversation';
import { spokenLines } from './voiceHistory';

/** Who said a line and on which channel (docs/voice/SYSTEM_DESIGN.md §8). */
const LABELS = {
  typed: 'Visitor (typed): ',
  text: 'Assistant (text): ',
  visitor: 'Visitor (voice): ',
  agent: 'Assistant (voice): ',
} as const;

/**
 * The contextual update a call starts with (docs/voice/SYSTEM_DESIGN.md §8): the heading, then
 * the text chat and earlier calls one line each, oldest first; `null` when there is nothing
 * earlier. Text turns count only when `done` with an answer (as the text model's history).
 * Whitespace is collapsed, so a line can't start a forged one; each line is cut at
 * `maxLineChars` and the oldest lines are dropped until the update fits `maxChars`.
 */
export function earlierConversation(entries: readonly ChatEntry[]): string | null {
  const lines = entries.flatMap(entryLines).map(cut);
  let first = 0;
  let chars =
    EARLIER_CONVERSATION_HEADING.length + lines.reduce((sum, line) => sum + 1 + line.length, 0);
  while (first < lines.length && chars > EARLIER_CONVERSATION_LIMITS.maxChars) {
    chars -= 1 + (lines[first]?.length ?? 0);
    first += 1;
  }
  const kept = lines.slice(first);
  return kept.length > 0 ? [EARLIER_CONVERSATION_HEADING, ...kept].join('\n') : null;
}

function entryLines(entry: ChatEntry): string[] {
  if (entry.kind === 'call') {
    return spokenLines(entry).map((line) => LABELS[line.role] + oneLine(line.text));
  }
  if (!isAnswered(entry)) return [];
  return [LABELS.typed + oneLine(entry.question), LABELS.text + oneLine(entry.answer)];
}

const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim();

function cut(line: string): string {
  const { maxLineChars } = EARLIER_CONVERSATION_LIMITS;
  return line.length > maxLineChars ? `${line.slice(0, maxLineChars - 1)}…` : line;
}
