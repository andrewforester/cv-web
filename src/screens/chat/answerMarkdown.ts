/**
 * The safe answer subset (SPEC O2): paragraphs (split by blank lines), `- ` bullet lists and
 * `**bold**`. Everything else, including HTML, links and an unclosed `**`, stays plain text. The
 * result is data for React text nodes: nothing is ever parsed as HTML.
 */
export interface AnswerSpan {
  text: string;
  bold: boolean;
}

export type AnswerLine = AnswerSpan[];

export type AnswerBlock =
  { type: 'paragraph'; lines: AnswerLine[] } | { type: 'list'; items: AnswerLine[] };

const BULLET = /^\s*- (.*)$/;
const BOLD = /\*\*(?=\S)(.+?)(?<=\S)\*\*/g;

export function parseInline(text: string): AnswerLine {
  const spans: AnswerSpan[] = [];
  let last = 0;
  for (const match of text.matchAll(BOLD)) {
    if (match.index > last) spans.push({ text: text.slice(last, match.index), bold: false });
    spans.push({ text: match[1] ?? '', bold: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) spans.push({ text: text.slice(last), bold: false });
  return spans;
}

export function parseAnswer(text: string): AnswerBlock[] {
  const blocks: AnswerBlock[] = [];
  let current: AnswerBlock | null = null;
  for (const line of text.split(/\r?\n/)) {
    const bullet = BULLET.exec(line);
    if (line.trim() === '') {
      current = null;
    } else if (bullet) {
      if (current?.type !== 'list') blocks.push((current = { type: 'list', items: [] }));
      current.items.push(parseInline(bullet[1] ?? ''));
    } else {
      if (current?.type !== 'paragraph') blocks.push((current = { type: 'paragraph', lines: [] }));
      current.lines.push(parseInline(line));
    }
  }
  return blocks;
}

/** Plain text of an answer for screen readers: markers removed, one line per paragraph line/item. */
export function answerPlainText(text: string): string {
  const lineText = (line: AnswerLine) => line.map((span) => span.text).join('');
  return parseAnswer(text)
    .flatMap((block) => (block.type === 'list' ? block.items : block.lines).map(lineText))
    .join('\n');
}
