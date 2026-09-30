import { highlight } from './consoleSyntax';

const tones = (line: string) => highlight(line).map(({ text, tone }) => `${tone}:${text}`);

describe('console syntax colours', () => {
  it('colours a token diff line: property, then the value', () => {
    expect(tones('--font-body-size: 15px;')).toEqual([
      'property:--font-body-size',
      'plain:: ',
      'number:15px',
      'plain:;',
    ]);
    expect(tones('--color-text: #001670;')).toContain('number:#001670');
  });

  it('colours generated JS: keywords and strings', () => {
    expect(tones("const { ChatRoute } = await import('./chat');")).toEqual([
      'keyword:const',
      'plain: { ChatRoute } = ',
      'keyword:await',
      'plain: ',
      'keyword:import',
      'plain:(',
      "string:'./chat'",
      'plain:);',
    ]);
  });

  it('keeps the text intact', () => {
    const line = "  font-family: 'Inter', system-ui, sans-serif;";
    expect(
      highlight(line)
        .map(({ text }) => text)
        .join(''),
    ).toBe(line);
  });
});
