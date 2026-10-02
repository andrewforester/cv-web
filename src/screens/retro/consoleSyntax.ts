/** Syntax colours of the console input (SPEC → DevTools console: DevTools light theme). */
export type SyntaxTone = 'plain' | 'keyword' | 'string' | 'number' | 'comment';

export interface SyntaxToken {
  text: string;
  tone: SyntaxTone;
}

// A comment to the end of the line; a string literal (unterminated while it is being typed);
// a keyword; a number outside strings.
const CODE =
  /(\/\/.*$)|('(?:[^'\\]|\\.)*(?:'|$)|"(?:[^"\\]|\\.)*(?:"|$))|\b(const|await|import)\b|(\b\d+(?:\.\d+)?\b)/g;
const TONES: SyntaxTone[] = ['comment', 'string', 'keyword', 'number'];

/** Splits one line of console input into coloured tokens; the text stays intact. */
export function highlight(line: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let last = 0;
  for (const match of line.matchAll(CODE)) {
    const group = match.slice(1).findIndex((value) => value !== undefined);
    if (match.index > last) tokens.push({ text: line.slice(last, match.index), tone: 'plain' });
    tokens.push({ text: match[0], tone: TONES[group] ?? 'plain' });
    last = match.index + match[0].length;
  }
  if (last < line.length) tokens.push({ text: line.slice(last), tone: 'plain' });
  return tokens;
}
