import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentToolRegistry } from '../agent';
import { CV_SECTION_IDS, FakeChatRepository, type ChatStreamEventV2 } from '../data/chat';
import { chatTestIds } from '../screens/chat/testIds';
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

describe('App: the chat and the page agent on the one page', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  it.each(['/', '/new'])('on %s: the page’s catalogue and a v4 request', async (path) => {
    window.history.replaceState(null, '', path);
    const registry = new AgentToolRegistry();
    const chat = new FakeChatRepository();
    const user = userEvent.setup();
    render(
      <AppProviders agentRegistry={registry} chatRepository={chat}>
        <App />
      </AppProviders>,
    );
    await user.click(await screen.findByTestId(chatTestIds.fab));

    await waitFor(() => expect(sectionsOf(registry)).toEqual([...CV_SECTION_IDS]));
    chat.reply({ type: 'delta', text: 'Agents.' }, done);
    await user.click(screen.getByRole('button', { name: 'How does he build with AI agents?' }));

    expect(chat.requests[0]).toEqual({
      v: 4,
      messages: [
        { role: 'user', content: 'How does he build with AI agents?', page: expect.any(Object) },
      ],
    });
  });
});
