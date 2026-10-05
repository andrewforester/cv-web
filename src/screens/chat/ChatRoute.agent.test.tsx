import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentToolRegistry, type AgentPageView } from '../../agent';
import { AppProviders } from '../../app/AppProviders';
import { buildCvPageToolSpecs, FakeChatRepository } from '../../data/chat';
import { StaticCvRepository } from '../../data/mock/StaticCvRepository';
import { ChatRoute } from './ChatRoute';
import { chatTestIds } from './testIds';
import { answer, inList, renderOpenChat, toolTurn } from './chatTestHarness';

const scrollToImpact = { name: 'scrollToSection', input: { section: 'impact' } } as const;
const openTelegram = { name: 'openContact', input: { channel: 'telegram' } } as const;

async function ask(
  user: ReturnType<typeof import('@testing-library/user-event').default.setup>,
  text: string,
) {
  await user.type(screen.getByTestId(chatTestIds.input), `${text}{Enter}`);
}

describe('chat page tools', () => {
  it('offers example commands only when page tools are mounted', async () => {
    const { user, repository } = await renderOpenChat({ withTools: true });
    expect(screen.getAllByTestId(chatTestIds.command)).toHaveLength(3);
    repository.reply(...answer('ok'));
    await user.click(screen.getByRole('button', { name: 'Scroll to his contacts' }));
    expect(screen.getByTestId(chatTestIds.visitorMessage)).toHaveTextContent(
      'Scroll to his contacts',
    );
  });

  it('hides the commands without page tools', async () => {
    await renderOpenChat();
    expect(screen.queryAllByTestId(chatTestIds.command)).toHaveLength(0);
    expect(screen.getAllByTestId(chatTestIds.suggestion)).toHaveLength(4);
  });

  it('runs a tool round: chip, follow-up with results and providerState, final text', async () => {
    const { repository, executor, user } = await renderOpenChat({ withTools: true });
    repository
      .reply(...toolTurn('Scrolling to his impact.', scrollToImpact))
      .reply(...answer('Here they are.'));

    await ask(user, 'Show the impact');

    expect(await inList().findByText('Here they are.')).toBeInTheDocument();
    expect(executor.executed).toEqual([{ id: 'toolu_1', ...scrollToImpact }]);
    expect(screen.getByTestId(chatTestIds.actionChip)).toHaveTextContent(
      'Scrolled to Selected impact',
    );
    expect(inList().getByText('Scrolling to his impact.')).toBeInTheDocument();
    expect(repository.requests[0]).toEqual({
      v: 4,
      messages: [
        {
          role: 'user',
          content: 'Show the impact',
          page: {
            viewport: 'desktop',
            chat: 'card',
            activeSection: null,
            highlighted: null,
            tools: ['highlightElement', 'openContact', 'scrollToSection'],
          },
        },
      ],
    });
    expect(repository.requests[1]?.messages).toMatchObject([
      { role: 'user', content: 'Show the impact' },
      {
        role: 'assistant',
        content: 'Scrolling to his impact.',
        toolCalls: [{ id: 'toolu_1', ...scrollToImpact }],
        providerState: 'opaque-state',
      },
      { role: 'user', toolResults: [{ callId: 'toolu_1', result: { ok: true } }] },
    ]);
    expect(screen.getByTestId(chatTestIds.announcer)).toHaveTextContent('Here they are.');
  });

  it('shows the running chip while the action executes and announces the outcome', async () => {
    const { repository, executor, user } = await renderOpenChat({ withTools: true });
    let finish: () => void = () => undefined;
    vi.spyOn(executor, 'execute').mockImplementation(
      () => new Promise((resolve) => (finish = () => resolve({ ok: true }))),
    );
    repository.reply(...toolTurn('', scrollToImpact)).reply(...answer('Done.'));

    await ask(user, 'Apps please');

    expect(await screen.findByTestId(chatTestIds.actionChip)).toHaveTextContent(
      'Scrolling to Selected impact…',
    );
    await act(async () => finish());
    await inList().findByText('Done.');
  });

  it('names the page’s items in chips and runs parallel calls in order', async () => {
    const { repository, executor, user } = await renderOpenChat({ withTools: true });
    const targets = ['experience:transcenda', 'app:cync', 'impact:users'];
    repository
      .reply(
        ...toolTurn(
          '',
          ...targets.map((target) => ({ name: 'highlightElement' as const, input: { target } })),
        ),
      )
      .reply(...answer('Ok.'));

    await ask(user, 'Transcenda, Cync and the users');

    await inList().findByText('Ok.');
    expect(executor.executed.map((call) => call.input.target)).toEqual(targets);
    const chips = screen.getAllByTestId(chatTestIds.actionChip).map((chip) => chip.textContent);
    expect(chips).toEqual(['Showing Transcenda', 'Showing Cync', 'Showing 1M+']);
  });

  it('names sections and contacts with the chat’s own words', async () => {
    const { repository, user } = await renderOpenChat({ withTools: true });
    repository
      .reply(
        ...toolTurn(
          '',
          { name: 'scrollToSection', input: { section: 'craft' } },
          { name: 'highlightElement', input: { target: 'section:about' } },
          { name: 'highlightElement', input: { target: 'contact:linkedin' } },
        ),
      )
      .reply(...answer('Ok.'));

    await ask(user, 'Craft, about, LinkedIn');

    await inList().findByText('Ok.');
    const chips = screen.getAllByTestId(chatTestIds.actionChip).map((chip) => chip.textContent);
    expect(chips).toEqual(['Scrolled to Code craft', 'Showing About me', 'Showing LinkedIn']);
  });

  it('answers calls beyond three with invalid_params without running them', async () => {
    const { repository, executor, user } = await renderOpenChat({ withTools: true });
    repository
      .reply(...toolTurn('', scrollToImpact, scrollToImpact, scrollToImpact, scrollToImpact))
      .reply(...answer('Ok.'));

    await ask(user, 'Many');

    await inList().findByText('Ok.');
    expect(executor.executed).toHaveLength(3);
    const results = repository.requests[1]?.messages.at(-1);
    expect(results).toMatchObject({
      toolResults: [
        { result: { ok: true } },
        { result: { ok: true } },
        { result: { ok: true } },
        { result: { ok: false, error: 'invalid_params' } },
      ],
    });
  });

  it('shows a failure chip and reports the error to the model', async () => {
    const { repository, executor, user } = await renderOpenChat({ withTools: true });
    executor.results.scrollToSection = { ok: false, error: 'not_available' };
    repository.reply(...toolTurn('', scrollToImpact)).reply(...answer('Sorry.'));

    await ask(user, 'Apps');

    await inList().findByText('Sorry.');
    expect(screen.getByTestId(chatTestIds.actionChip)).toHaveTextContent(
      'That isn’t available on this page.',
    );
    expect(repository.requests[1]?.messages.at(-1)).toMatchObject({
      toolResults: [{ result: { ok: false, error: 'not_available' } }],
    });
  });

  it('stops after two tool rounds: a third tool_use fails the turn without running it', async () => {
    const { repository, executor, user } = await renderOpenChat({ withTools: true });
    repository
      .reply(...toolTurn('', scrollToImpact))
      .reply(...toolTurn('', scrollToImpact))
      .reply(...toolTurn('', scrollToImpact));

    await ask(user, 'Loop');

    expect(await screen.findByTestId(chatTestIds.notice)).toHaveTextContent('couldn’t answer');
    expect(executor.executed).toHaveLength(2);
  });
});

describe('chat confirmation card', () => {
  it.each([
    ['email', 'Write an email to Andrew?', 'andriipanasiuk@gmail.com'],
    ['whatsapp', 'Open a WhatsApp chat with Andrew?', 'wa.me/380938977110'],
    ['linkedin', 'Open Andrew’s LinkedIn profile?', 'www.linkedin.com/in/andriipanasiuk'],
  ])('confirms %s with the page’s contact', async (channel, title, detail) => {
    const { repository, user } = await renderOpenChat({ withTools: true });
    repository.reply(...toolTurn('', { name: 'openContact', input: { channel } }));

    await ask(user, channel);

    const card = await screen.findByTestId(chatTestIds.confirmation);
    expect(card).toHaveTextContent(title);
    expect(card).toHaveTextContent(detail);
  });

  it('asks first, built from the page data; Confirm runs the tool, then the follow-up goes out', async () => {
    const { repository, executor, user } = await renderOpenChat({ withTools: true });
    repository.reply(...toolTurn('Opening Telegram.', openTelegram)).reply(...answer('Opened.'));

    await ask(user, 'Message him on Telegram');

    const card = await screen.findByTestId(chatTestIds.confirmation);
    expect(card).toHaveTextContent('Open a Telegram chat with Andrew?');
    expect(card).toHaveTextContent('t.me/+380938977110');
    expect(executor.executed).toHaveLength(0);
    expect(repository.requests).toHaveLength(1);
    expect(screen.getByTestId(chatTestIds.announcer)).toHaveTextContent(
      'Open a Telegram chat with Andrew?',
    );

    await user.click(within(card).getByTestId(chatTestIds.confirmAction));

    expect(await inList().findByText('Opened.')).toBeInTheDocument();
    expect(executor.executed).toEqual([{ id: 'toolu_1', ...openTelegram }]);
    expect(screen.queryByTestId(chatTestIds.confirmation)).not.toBeInTheDocument();
    expect(screen.getByTestId(chatTestIds.actionChip)).toHaveTextContent('Opened Telegram');
    expect(repository.requests[1]?.messages.at(-1)).toMatchObject({
      toolResults: [{ callId: 'toolu_1', result: { ok: true } }],
    });
  });

  it('Cancel returns declined and the tool never runs', async () => {
    const { repository, executor, user } = await renderOpenChat({ withTools: true });
    repository.reply(...toolTurn('', openTelegram)).reply(...answer('No problem.'));

    await ask(user, 'Telegram');
    await user.click(await screen.findByTestId(chatTestIds.declineAction));

    expect(await inList().findByText('No problem.')).toBeInTheDocument();
    expect(executor.executed).toHaveLength(0);
    expect(screen.getByTestId(chatTestIds.actionChip)).toHaveTextContent('Cancelled');
    expect(repository.requests[1]?.messages.at(-1)).toMatchObject({
      toolResults: [{ result: { ok: false, error: 'declined' } }],
    });
  });

  it('Stop while the card is open drops the turn; nothing runs and history stays clean', async () => {
    const { repository, executor, user } = await renderOpenChat({ withTools: true });
    repository.reply(...toolTurn('', openTelegram)).reply(...answer('Hi.'));

    await ask(user, 'Telegram');
    await screen.findByTestId(chatTestIds.confirmation);
    await user.click(screen.getByTestId(chatTestIds.stop));

    expect(executor.executed).toHaveLength(0);
    await ask(user, 'Hello');
    await inList().findByText('Hi.');
    expect(repository.requests[1]?.messages).toMatchObject([{ role: 'user', content: 'Hello' }]);
    expect(repository.requests[1]?.messages).toHaveLength(1);
  });
});

describe('chat tool loop failures and layout', () => {
  it('Stop during execution drops the turn', async () => {
    const { repository, executor, user } = await renderOpenChat({ withTools: true });
    let finish: () => void = () => undefined;
    vi.spyOn(executor, 'execute').mockImplementation(
      () => new Promise((resolve) => (finish = () => resolve({ ok: true }))),
    );
    repository.reply(...toolTurn('', scrollToImpact)).reply(...answer('Hi.'));

    await ask(user, 'Apps');
    await screen.findByTestId(chatTestIds.actionChip);
    await user.click(screen.getByTestId(chatTestIds.stop));
    await act(async () => finish());

    expect(repository.requests).toHaveLength(1);
    await ask(user, 'Again');
    await inList().findByText('Hi.');
    expect(repository.requests[1]?.messages).toHaveLength(1);
  });

  it('a failed follow-up is retried with the same history and never re-runs the tools', async () => {
    const { repository, executor, user } = await renderOpenChat({ withTools: true });
    repository
      .reply(...toolTurn('Scrolling.', scrollToImpact))
      .reply({ type: 'error', error: { code: 'upstream_error', message: 'x', retryable: true } })
      .reply(...answer('Finally.'));

    await ask(user, 'Apps');
    await user.click(await screen.findByTestId(chatTestIds.retry));

    expect(await inList().findByText('Finally.')).toBeInTheDocument();
    expect(executor.executed).toHaveLength(1);
    expect(repository.requests[2]).toEqual(repository.requests[1]);
    expect(repository.requests[2]?.messages).toHaveLength(3);
  });

  it('closes the mobile sheet after a visual action and keeps the conversation', async () => {
    const matchMedia = vi.fn((query: string) => ({
      matches: query.includes('max-width: 599px'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal('matchMedia', matchMedia);
    const { repository, user } = await renderOpenChat({ withTools: true });
    repository.reply(...toolTurn('', scrollToImpact)).reply(...answer('Here.'));

    await ask(user, 'Apps');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByTestId(chatTestIds.fab));
    expect(await inList().findByText('Here.')).toBeInTheDocument();
    expect(screen.getByTestId(chatTestIds.actionChip)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('keeps the desktop card open after a visual action', async () => {
    const { repository, user } = await renderOpenChat({ withTools: true });
    repository.reply(...toolTurn('', scrollToImpact)).reply(...answer('Here.'));

    await ask(user, 'Apps');

    await inList().findByText('Here.');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('chat over the real tool registry', () => {
  it('runs scrollToSection, and openContact after Confirm (not declined)', async () => {
    const page = await new StaticCvRepository().getCvPage();
    const registry = new AgentToolRegistry(buildCvPageToolSpecs(page));
    const scroll = vi.fn(() => ({ ok: true }) as const);
    const open = vi.fn(() => ({ ok: true }) as const);
    registry.register('scrollToSection', scroll);
    registry.register('openContact', open);
    const repository = new FakeChatRepository();
    const user = userEvent.setup();
    render(
      <AppProviders chatRepository={repository} agentRegistry={registry}>
        <ChatRoute />
      </AppProviders>,
    );
    await user.click(screen.getByTestId(chatTestIds.fab));
    repository
      .reply(...toolTurn('', scrollToImpact))
      .reply(...answer('Scrolled.'))
      .reply(...toolTurn('', openTelegram))
      .reply(...answer('Opened.'));

    await ask(user, 'Show the impact');
    expect(await inList().findByText('Scrolled.')).toBeInTheDocument();
    expect(scroll).toHaveBeenCalledWith({ section: 'impact' });

    await ask(user, 'Telegram');
    expect(open).not.toHaveBeenCalled();
    await user.click(await screen.findByTestId(chatTestIds.confirmAction));
    expect(await inList().findByText('Opened.')).toBeInTheDocument();
    expect(open).toHaveBeenCalledWith({ channel: 'telegram' });
    expect(repository.requests.at(-1)?.messages.at(-1)).toMatchObject({
      toolResults: [{ result: { ok: true } }],
    });
  });

  it("sends the page's view (section in view, highlighted target) with each question", async () => {
    const page = await new StaticCvRepository().getCvPage();
    const registry = new AgentToolRegistry(buildCvPageToolSpecs(page));
    let view: AgentPageView = { activeSection: 'impact', highlighted: 'impact:users' };
    registry.setViewSource(() => view);
    const repository = new FakeChatRepository();
    const user = userEvent.setup();
    render(
      <AppProviders chatRepository={repository} agentRegistry={registry}>
        <ChatRoute />
      </AppProviders>,
    );
    await user.click(screen.getByTestId(chatTestIds.fab));
    repository.reply(...answer('One.')).reply(...answer('Two.'));

    await ask(user, 'What is this?');
    expect(await inList().findByText('One.')).toBeInTheDocument();
    expect(repository.requests[0]?.messages.at(-1)).toMatchObject({
      page: { activeSection: 'impact', highlighted: 'impact:users' },
    });

    view = { activeSection: null, highlighted: null };
    await ask(user, 'And this?');
    expect(await inList().findByText('Two.')).toBeInTheDocument();
    const [first, , second] = repository.requests[1]?.messages ?? [];
    expect(first).toMatchObject({ page: { activeSection: 'impact', highlighted: 'impact:users' } });
    expect(second).toMatchObject({ page: { activeSection: null, highlighted: null } });
  });
});
