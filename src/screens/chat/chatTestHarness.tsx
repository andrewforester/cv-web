import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProviders } from '../../app/AppProviders';
import { FakeChatRepository, type ChatStreamEvent } from '../../data/chat';
import type { Locale } from '../../i18n';
import { ChatRoute } from './ChatRoute';
import { chatTestIds } from './testIds';

/** Test helper: the chat widget over a `FakeChatRepository`, already opened. */
export async function renderOpenChat(locale: Locale = 'en') {
  const repository = new FakeChatRepository();
  const user = userEvent.setup();
  render(
    <AppProviders chatRepository={repository} locale={locale}>
      <ChatRoute />
    </AppProviders>,
  );
  await user.click(screen.getByTestId(chatTestIds.fab));
  return { repository, user };
}

export const usage = {
  inputTokens: 1,
  outputTokens: 1,
  cacheReadInputTokens: 0,
  cacheCreationInputTokens: 0,
};

export function answer(...texts: string[]): ChatStreamEvent[] {
  return [
    ...texts.map((text) => ({ type: 'delta' as const, text })),
    { type: 'done', stopReason: 'end_turn', usage },
  ];
}

/** Queries inside the message list (answers are also in the live region). */
export function inList() {
  return within(screen.getByTestId(chatTestIds.list));
}
