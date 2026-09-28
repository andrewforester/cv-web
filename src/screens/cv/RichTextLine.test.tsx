import { render, screen } from '@testing-library/react';
import { RichTextLine } from './RichTextLine';

describe('RichTextLine', () => {
  it('renders emphasised fragments with their style and plain text around them', () => {
    const { container } = render(
      <RichTextLine
        text={[
          { text: 'Worked on ' },
          { text: 'Cync', emphasis: 'boldItalic' },
          { text: ' as a ' },
          { text: 'Senior Engineer', emphasis: 'medium' },
        ]}
      />,
    );

    expect(container.firstChild).toHaveTextContent('Worked on Cync as a Senior Engineer');
    expect(screen.getByText('Cync')).toHaveClass('boldItalic');
    expect(screen.getByText('Senior Engineer')).toHaveClass('medium');
  });
});
