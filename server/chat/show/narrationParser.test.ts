import { describe, expect, it } from 'vitest';
import { MAX_RAW_LINE_CHARS, NarrationParser } from './narrationParser.js';

/** Feeds `pieces` in order, then ends the stream; returns every accepted line. */
function parse(pieces: string[], complete = true) {
  const parser = new NarrationParser();
  const lines = pieces.flatMap((piece) => parser.push(piece));
  return { lines: [...lines, ...parser.end(complete)], count: parser.count };
}

describe('NarrationParser', () => {
  it('emits a line as soon as it is complete, across arbitrary pieces', () => {
    const parser = new NarrationParser();
    expect(parser.push('fon')).toEqual([]);
    expect(parser.push('ts: Fonts first.\nlay')).toEqual([{ key: 'fonts', text: 'Fonts first.' }]);
    expect(parser.push('out: Now the layout.\r\n')).toEqual([
      { key: 'layout', text: 'Now the layout.' },
    ]);
    expect(parser.count).toBe(2);
  });

  it('counts a last line without a line break after a complete answer', () => {
    expect(parse(['links: All of it.\nfinale: Done.']).lines).toEqual([
      { key: 'links', text: 'All of it.' },
      { key: 'finale', text: 'Done.' },
    ]);
  });

  it('drops the unfinished last line after max_tokens', () => {
    expect(parse(['links: All of it.\nfinale: Done, this is And'], false).lines).toEqual([
      { key: 'links', text: 'All of it.' },
    ]);
  });

  it('drops junk, unknown keys, empty texts and repeats (first one wins)', () => {
    const { lines, count } = parse([
      'Sure! Here are the lines:\n\n',
      'marquee: Not a step.\n',
      'fonts:\n',
      'fonts: First.\n',
      'fonts: Second.\n',
      'just some words\n',
    ]);
    expect(lines).toEqual([{ key: 'fonts', text: 'First.' }]);
    expect(count).toBe(1);
  });

  it('accepts keys in any case and strips list markers, markdown, tags and quotes', () => {
    const { lines } = parse([
      '1. **Fonts**: Fonts *first*.\n',
      '- LAYOUT: "Now the `layout`."\n',
      '> links :  <b>All</b>   of it.\n',
    ]);
    expect(lines).toEqual([
      { key: 'fonts', text: 'Fonts first.' },
      { key: 'layout', text: 'Now the layout.' },
      { key: 'links', text: 'All of it.' },
    ]);
  });

  it('shortens a text over 200 characters at a word boundary', () => {
    const text = `${'word '.repeat(60)}end.`;
    const [line] = parse([`fonts: ${text}\n`]).lines;
    expect(line?.text.length).toBeLessThanOrEqual(200);
    expect(line?.text).toMatch(/^word( word)*…$/);
  });

  it('drops a runaway line, even one that arrives without a line break for a while', () => {
    const runaway = 'x'.repeat(MAX_RAW_LINE_CHARS + 1);
    const { lines } = parse([
      `fonts: ${runaway}\n`,
      `layout: ${runaway.slice(0, 300)}`,
      runaway.slice(0, 400),
      ' still going\n',
      'links: Back on track.\n',
      `finale: ${runaway}`,
    ]);
    expect(lines).toEqual([{ key: 'links', text: 'Back on track.' }]);
  });
});
