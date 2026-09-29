import { render } from '@testing-library/react';
import { answerPlainText, parseAnswer } from './answerMarkdown';
import { AnswerText } from './AnswerText';

describe('answer renderer (safe subset)', () => {
  it('renders paragraphs, "- " lists and **bold**', () => {
    const { container } = render(
      <AnswerText text={'Andrew has **12+ years**.\n\n- **Transcenda**: Cync\n- Samsung\n\nBye'} />,
    );
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]?.querySelector('strong')).toHaveTextContent('12+ years');
    const items = container.querySelectorAll('ul > li');
    expect([...items].map((item) => item.textContent)).toEqual(['Transcenda: Cync', 'Samsung']);
    expect(items[0]?.querySelector('strong')).toHaveTextContent('Transcenda');
  });

  it('keeps HTML, links, headings, numbers and an unclosed ** as plain text', () => {
    const text =
      '<script>alert(1)</script> <b>hi</b>\n[CV](https://evil.example) *it* `code`\n## Title\n1. one\n**open';
    const { container } = render(<AnswerText text={text} />);
    expect(container.querySelector('script, b, a, em, code, h2, ol')).toBeNull();
    expect(container.querySelectorAll('strong')).toHaveLength(0);
    expect(container).toHaveTextContent('<script>alert(1)</script> <b>hi</b>');
    expect(container).toHaveTextContent('[CV](https://evil.example) *it* `code`');
    expect(container).toHaveTextContent('## Title');
    expect(container).toHaveTextContent('**open');
  });

  it('shows the caret only while streaming, after the last text', () => {
    const { container, rerender } = render(<AnswerText text={'- a\n- b'} caret />);
    const caret = container.querySelector('[aria-hidden="true"]');
    expect(caret?.parentElement).toHaveTextContent('b');
    rerender(<AnswerText text={'- a\n- b'} />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('parses into blocks and plain text for announcements', () => {
    expect(parseAnswer('a\nb\n- c')).toEqual([
      {
        type: 'paragraph',
        lines: [[{ text: 'a', bold: false }], [{ text: 'b', bold: false }]],
      },
      { type: 'list', items: [[{ text: 'c', bold: false }]] },
    ]);
    expect(answerPlainText('**Hi** there\n\n- one\n- **two**')).toBe('Hi there\none\ntwo');
  });
});
