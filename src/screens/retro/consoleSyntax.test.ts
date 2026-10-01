import { highlight } from './consoleSyntax';

const tones = (line: string) => highlight(line).map(({ text, tone }) => `${tone}:${text}`);

describe('console syntax colours (DevTools light)', () => {
  it('colours the target comment as a comment', () => {
    expect(tones('// → header')).toEqual(['comment:// → header']);
  });

  it('colours keywords and strings of a module import', () => {
    expect(tones("const { ChatRoute } = await import('./chat')")).toEqual([
      'keyword:const',
      'plain: { ChatRoute } = ',
      'keyword:await',
      'plain: ',
      'keyword:import',
      'plain:(',
      "string:'./chat'",
      'plain:)',
    ]);
  });

  it('keeps quotes inside a double-quoted value in one string', () => {
    expect(tones(`style.setProperty('--font-family', "'Inter', sans-serif")`)).toEqual([
      'plain:style.setProperty(',
      "string:'--font-family'",
      'plain:, ',
      `string:"'Inter', sans-serif"`,
      'plain:)',
    ]);
  });

  it('colours a string still being typed, and numbers only outside strings', () => {
    expect(tones("style.setProperty('--space-2")).toContain("string:'--space-2");
    expect(tones('style.opacity = 0.5')).toContain('number:0.5');
    expect(tones('document')).toEqual(['plain:document']);
  });

  it('keeps the text intact', () => {
    const line = `document.querySelector('style[data-retro-layer="page-frame"]').remove()`;
    expect(
      highlight(line)
        .map(({ text }) => text)
        .join(''),
    ).toBe(line);
  });
});
