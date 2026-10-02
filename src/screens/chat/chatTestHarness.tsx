import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProviders } from '../../app/AppProviders';
import {
  buildAgentToolSpecs,
  buildProfileToolSpecs,
  FakeChatRepository,
  type AgentToolCall,
  type ChatPage,
  type ChatStreamEventV2,
} from '../../data/chat';
import { StaticCvRepository } from '../../data/mock/StaticCvRepository';
import type { Locale } from '../../i18n';
import { AgentExecutorContext } from './agentExecutor';
import { FakeAgentExecutor } from './fakeAgentExecutor';
import { ChatRoute } from './ChatRoute';
import { chatTestIds } from './testIds';

/** The page's real catalogue, as the app's `AgentProvider` builds it. */
async function catalogue(page: ChatPage) {
  const data = new StaticCvRepository();
  return page === 'profile'
    ? buildProfileToolSpecs(await data.getProfile('en'))
    : buildAgentToolSpecs(await data.getCv('en'));
}

/**
 * Test helper: the chat widget on `page` (default the CV) over a `FakeChatRepository`, already
 * opened. With `withTools`, the page tools are a `FakeAgentExecutor` over the page's real
 * catalogue (returned as `executor`).
 */
export async function renderOpenChat(
  locale: Locale = 'en',
  { withTools = false, page = 'cv' as ChatPage } = {},
) {
  const repository = new FakeChatRepository();
  const executor = new FakeAgentExecutor(await catalogue(page));
  const user = userEvent.setup();
  render(
    <AppProviders chatRepository={repository} locale={locale} page={page}>
      <AgentExecutorContext value={withTools ? executor : null}>
        <ChatRoute page={page} />
      </AgentExecutorContext>
    </AppProviders>,
  );
  await user.click(screen.getByTestId(chatTestIds.fab));
  return { repository, executor, user };
}

export const usage = {
  inputTokens: 1,
  outputTokens: 1,
  cacheReadInputTokens: 0,
  cacheCreationInputTokens: 0,
};

export function answer(...texts: string[]): ChatStreamEventV2[] {
  return [
    ...texts.map((text) => ({ type: 'delta' as const, text })),
    { type: 'done', stopReason: 'end_turn', usage },
  ];
}

/** Queries inside the message list (answers are also in the live region). */
export function inList() {
  return within(screen.getByTestId(chatTestIds.list));
}

/** A model message that says `text` and ends in these tool calls (`done: tool_use`). */
export function toolTurn(text: string, ...calls: Omit<AgentToolCall, 'id'>[]): ChatStreamEventV2[] {
  return [
    ...(text ? [{ type: 'delta' as const, text }] : []),
    ...calls.map((call, index) => ({
      type: 'tool_call' as const,
      id: `toolu_${index + 1}`,
      ...call,
    })),
    { type: 'done', stopReason: 'tool_use', usage, providerState: 'opaque-state' },
  ];
}
