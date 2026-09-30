/** Syntax colours of the console (SPEC → Live-fix console: the VGA palette). */
export type SyntaxTone = 'plain' | 'keyword' | 'property' | 'string' | 'number';

export interface SyntaxToken {
  text: string;
  tone: SyntaxTone;
}

// Keywords and selectors; `:root` and at-rules; a leading property name; numbers and colours.
const CODE =
  /(\b(?:const|await|import|document)\b)|(@keyframes|@media|:root)|(^\s*(?:--[\w-]+|[a-z-]+)(?=:\s))|(#[0-9a-f]{3,8}\b|\b\d+(?:\.\d+)?(?:px|%|fr|deg|s|em)?\b)/gi;
const TONES: SyntaxTone[] = ['keyword', 'number', 'property', 'number'];

function codeTokens(code: string, atLineStart: boolean): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let last = 0;
  for (const match of code.matchAll(CODE)) {
    const group = match.slice(1).findIndex((value) => value !== undefined);
    if (group === 2 && !atLineStart) continue;
    if (match.index > last) tokens.push({ text: code.slice(last, match.index), tone: 'plain' });
    tokens.push({ text: match[0], tone: TONES[group] ?? 'plain' });
    last = match.index + match[0].length;
  }
  if (last < code.length) tokens.push({ text: code.slice(last), tone: 'plain' });
  return tokens;
}

/** Splits one line of CSS or JS into coloured tokens; quoted strings first, then the code rules. */
export function highlight(line: string): SyntaxToken[] {
  return line
    .split(/('[^']*')/)
    .flatMap((part, index) =>
      index % 2 ? [{ text: part, tone: 'string' as const }] : codeTokens(part, index === 0),
    )
    .filter(({ text }) => text !== '');
}
