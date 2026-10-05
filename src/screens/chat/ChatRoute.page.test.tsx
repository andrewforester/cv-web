import { screen } from '@testing-library/react';
import { answer, inList, renderOpenChat, toolTurn } from './chatTestHarness';
import { chatTestIds } from './testIds';

const texts = (testId: string) => screen.queryAllByTestId(testId).map((chip) => chip.textContent);

describe('chat on the one page (ADR-0006 → Decision 3)', () => {
  it('offers the page’s first questions', async () => {
    await renderOpenChat();
    expect(texts(chatTestIds.suggestion)).toEqual([
      'How does he build with AI agents?',
      'What impact has he had?',
      'Which apps has he shipped?',
      'Is he open to new roles?',
    ]);
  });

  it('offers the page’s example commands', async () => {
    await renderOpenChat({ withTools: true });
    expect(texts(chatTestIds.command)).toEqual([
      'Show his selected impact',
      'Highlight his work at Transcenda',
      'Scroll to his contacts',
    ]);
  });

  it('says it answers from this page', async () => {
    await renderOpenChat();
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription(
      'AI assistant · answers from this page',
    );
    expect(inList().getAllByRole('listitem')[0]).toHaveTextContent(/I answer from this page\.$/);
  });

  it('sends v4 without page id or locale, in every request of a turn', async () => {
    const { repository, user } = await renderOpenChat({ withTools: true });
    repository
      .reply(...toolTurn('', { name: 'scrollToSection', input: { section: 'impact' } }))
      .reply(...answer('Here.'));

    await user.click(screen.getByRole('button', { name: 'Show his selected impact' }));
    await inList().findByText('Here.');

    expect(repository.requests).toHaveLength(2);
    for (const request of repository.requests) {
      expect(request.v).toBe(4);
      expect(request).not.toHaveProperty('page');
      expect(request).not.toHaveProperty('locale');
    }
    expect(repository.requests[0]?.messages[0]).not.toHaveProperty('page.route');
    expect(repository.requests[0]?.messages[0]).not.toHaveProperty('page.locale');
  });
});
