import { act, fireEvent, screen, within } from '@testing-library/react';
import { answer, inList, renderOpenChat } from './chatTestHarness';
import { chatTestIds } from './testIds';

describe('chat widget notices', () => {
  it('shows an error after partial text and retries the same question', async () => {
    const { repository, user } = await renderOpenChat();
    repository.reply(
      { type: 'delta', text: 'Partial' },
      { type: 'error', error: { code: 'upstream_error', message: 'x', retryable: true } },
    );
    await user.click(screen.getByRole('button', { name: 'Which AI tools does he use?' }));

    const notice = await screen.findByTestId(chatTestIds.notice);
    expect(notice).toHaveTextContent('Sorry, I couldn’t answer. Please try again.');
    expect(inList().getByText('Partial')).toBeInTheDocument();

    repository.reply(...answer('Copilot and Cursor.'));
    await user.click(within(notice).getByRole('button', { name: 'Try again' }));

    expect(await inList().findByText('Copilot and Cursor.')).toBeInTheDocument();
    expect(screen.queryByTestId(chatTestIds.notice)).not.toBeInTheDocument();
    expect(inList().queryByText('Partial')).not.toBeInTheDocument();
    expect(repository.requests[1]).toEqual(repository.requests[0]);
    expect(screen.getByTestId(chatTestIds.input)).toHaveFocus();
  });

  it('treats a stream that ends without a terminal event as a retryable error', async () => {
    const { repository, user } = await renderOpenChat();
    repository.reply({ type: 'delta', text: 'Cut' });
    await user.click(screen.getByRole('button', { name: 'Has he led a team?' }));
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('shows the neutral rate-limit notice with Try again', async () => {
    const { repository, user } = await renderOpenChat();
    repository.reply({
      type: 'error',
      error: { code: 'rate_limited', message: 'x', retryable: true, retryAfterSeconds: 60 },
    });
    await user.click(screen.getByRole('button', { name: 'Has he led a team?' }));

    const notice = await screen.findByTestId(chatTestIds.notice);
    expect(notice).toHaveTextContent('I’m getting a lot of questions right now.');
    expect(notice).not.toHaveClass('error');
    expect(within(notice).getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('offers a new chat on conversation_limit and clears the conversation', async () => {
    const { repository, user } = await renderOpenChat();
    repository.reply({
      type: 'error',
      error: { code: 'conversation_limit', message: 'x', retryable: false },
    });
    await user.click(screen.getByRole('button', { name: 'Has he led a team?' }));
    expect(await screen.findByTestId(chatTestIds.notice)).toHaveTextContent(
      'This chat has reached its length limit.',
    );

    await user.click(screen.getByRole('button', { name: 'Start a new chat' }));

    expect(screen.queryByTestId(chatTestIds.visitorMessage)).not.toBeInTheDocument();
    expect(screen.getAllByTestId(chatTestIds.suggestion)).toHaveLength(4);
  });

  it('offers a new chat before sending past 10 questions', async () => {
    const { repository, user } = await renderOpenChat();
    const input = screen.getByTestId(chatTestIds.input);
    for (let i = 1; i <= 10; i++) {
      repository.reply(...answer(`Answer ${i}`));
      await user.type(input, `Question ${i}{Enter}`);
      await inList().findByText(`Answer ${i}`);
    }
    await user.type(input, 'One more');

    expect(screen.getByTestId(chatTestIds.send)).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Start a new chat' })).toBeInTheDocument();
    expect(repository.requests).toHaveLength(10);
  });

  it('blocks sending while offline and over the length limit', async () => {
    const { user } = await renderOpenChat();
    const input = screen.getByTestId(chatTestIds.input);
    await user.type(input, 'Hello');
    expect(screen.getByTestId(chatTestIds.send)).toBeEnabled();

    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    act(() => void window.dispatchEvent(new Event('offline')));
    expect(screen.getByRole('status')).toHaveTextContent('You’re offline.');
    expect(screen.getByTestId(chatTestIds.send)).toBeDisabled();
    vi.restoreAllMocks();
    act(() => void window.dispatchEvent(new Event('online')));
    expect(screen.queryByTestId(chatTestIds.offline)).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'x'.repeat(1001) } });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByTestId(chatTestIds.meta)).toHaveTextContent(
      'Shorten your question to 1000 characters or fewer.1001 / 1000',
    );
    expect(screen.getByTestId(chatTestIds.send)).toBeDisabled();
  });
});
