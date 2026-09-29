import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProviders } from '../../app/AppProviders';
import { FakeChatRepository } from '../../data/chat';
import { answer, inList, renderOpenChat } from './chatTestHarness';
import { ChatRoute } from './ChatRoute';
import { chatTestIds } from './testIds';

describe('chat widget', () => {
  it('opens from the FAB, shows the empty state, closes with × and returns focus', async () => {
    const user = userEvent.setup();
    render(
      <AppProviders chatRepository={new FakeChatRepository()} locale="en">
        <ChatRoute />
      </AppProviders>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open chat with the AI assistant' }));

    const dialog = screen.getByRole('dialog', { name: 'Ask about Andrew' });
    expect(dialog).toHaveAccessibleDescription('AI assistant · answers from this CV');
    expect(within(dialog).getByRole('textbox', { name: 'Your question' })).toHaveFocus();
    expect(within(dialog).getAllByTestId(chatTestIds.suggestion)).toHaveLength(4);
    expect(within(dialog).getByRole('button', { name: 'Send' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Close chat' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByTestId(chatTestIds.fab)).toHaveFocus();
  });

  it('closes on Esc and returns focus to the FAB; the conversation survives reopening', async () => {
    const { repository, user } = await renderOpenChat();
    repository.reply(...answer('Since 2012.'));
    await user.click(screen.getByRole('button', { name: 'What is his experience with Android?' }));
    expect(await inList().findByText('Since 2012.')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.getByTestId(chatTestIds.fab)).toHaveFocus();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getByTestId(chatTestIds.fab));
    expect(inList().getByText('Since 2012.')).toBeInTheDocument();
  });

  it('sends a suggested question with the locale and renders deltas progressively', async () => {
    const { repository, user } = await renderOpenChat();
    await user.click(screen.getByRole('button', { name: 'Which apps has he worked on?' }));

    expect(screen.getByTestId(chatTestIds.visitorMessage)).toHaveTextContent(
      'Which apps has he worked on?',
    );
    expect(screen.queryAllByTestId(chatTestIds.suggestion)).toHaveLength(0);
    expect(screen.getByTestId(chatTestIds.typing)).toBeInTheDocument();
    expect(screen.getByTestId(chatTestIds.announcer)).toHaveTextContent('Assistant is typing…');
    expect(repository.requests[0]).toMatchObject({
      v: 2,
      locale: 'en',
      messages: [
        {
          role: 'user',
          content: 'Which apps has he worked on?',
          page: { route: '/', locale: 'en', tools: [] },
        },
      ],
    });

    await act(async () => repository.emit({ type: 'delta', text: 'He worked on **Cync**' }));
    const bubble = screen.getByTestId(chatTestIds.assistantMessage);
    expect(bubble).toHaveTextContent('He worked on Cync');
    expect(screen.queryByTestId(chatTestIds.typing)).not.toBeInTheDocument();
    expect(screen.getByTestId(chatTestIds.stop)).toBeInTheDocument();

    await act(async () => repository.emit(...answer(' and August Home.')));
    expect(bubble).toHaveTextContent('He worked on Cync and August Home.');
    expect(within(bubble).getByText('Cync').tagName).toBe('STRONG');
    expect(screen.getByTestId(chatTestIds.announcer)).toHaveTextContent(
      'He worked on Cync and August Home.',
    );
    expect(screen.getByTestId(chatTestIds.send)).toBeInTheDocument();
  });

  it('sends typed text with Enter, keeps Shift+Enter as a newline, sends completed history', async () => {
    const { repository, user } = await renderOpenChat();
    repository.reply(...answer('A1')).reply(...answer('A2'));
    const input = screen.getByTestId(chatTestIds.input);

    await user.type(input, 'Line 1{Shift>}{Enter}{/Shift}Line 2{Enter}');
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(await inList().findByText('A1')).toBeInTheDocument();

    await user.type(input, '  Second  {Enter}');
    await inList().findByText('A2');
    expect(repository.requests[1]?.messages).toMatchObject([
      { role: 'user', content: 'Line 1\nLine 2' },
      { role: 'assistant', content: 'A1' },
      { role: 'user', content: 'Second' },
    ]);
  });

  it('stops a streaming answer, keeps the partial text and drops it from the history', async () => {
    const { repository, user } = await renderOpenChat();
    await user.click(screen.getByRole('button', { name: 'Has he led a team?' }));
    await act(async () => repository.emit({ type: 'delta', text: 'Yes, at ivi' }));

    await user.click(screen.getByRole('button', { name: 'Stop answer' }));

    expect(repository.isStreaming).toBe(false);
    expect(screen.getByTestId(chatTestIds.assistantMessage)).toHaveTextContent('Yes, at ivi');
    expect(screen.getByTestId(chatTestIds.caption)).toHaveTextContent('Answer stopped.');
    expect(screen.getByTestId(chatTestIds.input)).toHaveFocus();

    repository.reply(...answer('Next'));
    await user.type(screen.getByTestId(chatTestIds.input), 'Next?{Enter}');
    await inList().findByText('Next');
    expect(repository.requests[1]?.messages).toMatchObject([{ role: 'user', content: 'Next?' }]);
  });

  it('shows Ukrainian texts', async () => {
    const { repository, user } = await renderOpenChat('uk');
    expect(screen.getByRole('dialog', { name: 'Запитайте про Андрія' })).toBeInTheDocument();
    repository.reply(...answer('Так.'));

    await user.click(screen.getByRole('button', { name: 'Чи керував він командою?' }));

    expect(await inList().findByText('Так.')).toBeInTheDocument();
    expect(repository.requests[0]?.locale).toBe('uk');
    expect(screen.getByText('Відповіді генерує ШІ, тож можливі помилки.')).toBeInTheDocument();
  });
});
