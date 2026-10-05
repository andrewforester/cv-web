import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentToolRegistry } from '../agent';
import { FakeChatRepository, type ChatStreamEventV2 } from '../data/chat';
import { chatTestIds } from '../screens/chat/testIds';
import { homeTestIds } from '../screens/home/testIds';
import { App } from './App';
import { AppProviders } from './AppProviders';

const done: ChatStreamEventV2 = {
  type: 'done',
  stopReason: 'end_turn',
  usage: { inputTokens: 1, outputTokens: 1, cacheReadInputTokens: 0, cacheCreationInputTokens: 0 },
};

const sectionsOf = (registry: AgentToolRegistry) =>
  registry.specs().find((spec) => spec.name === 'scrollToSection')?.inputSchema.properties.section
    ?.enum;

// Until the chat moves to v4 (CV-111) it keeps v2 and takes its page id from the URL, over the one page.
describe('App: the chat and the page agent follow the page', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  async function renderAt(path: string) {
    window.history.replaceState(null, '', path);
    const registry = new AgentToolRegistry();
    const chat = new FakeChatRepository();
    const user = userEvent.setup();
    render(
      <AppProviders locale="en" agentRegistry={registry} chatRepository={chat}>
        <App />
      </AppProviders>,
    );
    await screen.findByTestId(homeTestIds.name);
    await user.click(await screen.findByTestId(chatTestIds.fab));
    return { registry, chat, user };
  }

  it('on /new: /new’s catalogue, suggestions and page id in the request', async () => {
    const { registry, chat, user } = await renderAt('/new');

    await waitFor(() => expect(sectionsOf(registry)).toContain('impact'));
    expect(sectionsOf(registry)).not.toContain('summary');
    chat.reply({ type: 'delta', text: 'Agents.' }, done);
    await user.click(screen.getByRole('button', { name: 'What does he build with AI?' }));

    expect(chat.requests[0]).toMatchObject({
      page: 'profile',
      messages: [{ page: { route: '/new' } }],
    });
  });

  it('on /: the CV catalogue, today’s suggestions and the cv page id', async () => {
    const { registry, chat, user } = await renderAt('/');

    await waitFor(() => expect(sectionsOf(registry)).toContain('summary'));
    chat.reply({ type: 'delta', text: 'Since 2012.' }, done);
    await user.click(screen.getByRole('button', { name: 'What is his experience with Android?' }));

    expect(chat.requests[0]).toMatchObject({ page: 'cv', messages: [{ page: { route: '/' } }] });
  });
});
