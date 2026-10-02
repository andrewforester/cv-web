import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentToolRegistry, type AgentPageView } from '../../agent';
import { AppProviders } from '../../app/AppProviders';
import { buildAgentToolSpecs, FakeChatRepository } from '../../data/chat';
import { StaticCvRepository } from '../../data/mock/StaticCvRepository';
import { ChatRoute } from './ChatRoute';
import { chatTestIds } from './testIds';
import { answer, inList, renderOpenChat, toolTurn } from './chatTestHarness';

const scrollToApps = { name: 'scrollToSection', input: { section: 'apps' } } as const;
const openTelegram = { name: 'openContact', input: { channel: 'telegram' } } as const;

async function ask(
  user: ReturnType<typeof import('@testing-library/user-event').default.setup>,
  text: string,
) {
  await user.type(screen.getByTestId(chatTestIds.input), `${text}{Enter}`);
}

describe('chat page tools', () => {
  it('offers example commands only when page tools are mounted', async () => {
    const { user, repository } = await renderOpenChat('en', { withTools: true });
    expect(screen.getAllByTestId(chatTestIds.command)).toHaveLength(3);
    repository.reply(...answer('ok'));
    await user.click(screen.getByRole('button', { name: 'Scroll to the apps' }));
    expect(screen.getByTestId(chatTestIds.visitorMessage)).toHaveTextContent('Scroll to the apps');
  });

  it('hides the commands without page tools', async () => {
    await renderOpenChat('en');
    expect(screen.queryAllByTestId(chatTestIds.command)).toHaveLength(0);
    expect(screen.getAllByTestId(chatTestIds.suggestion)).toHaveLength(4);
  });

  it('runs a tool round: chip, follow-up with results and providerState, final text', async () => {
    const { repository, executor, user } = await renderOpenChat('en', { withTools: true });
    repository
      .reply(...toolTurn('Scrolling to the apps.', scrollToApps))
      .reply(...answer('Here they are.'));

    await ask(user, 'Show the apps');

    expect(await inList().findByText('Here they are.')).toBeInTheDocument();
    expect(executor.executed).toEqual([{ id: 'toolu_1', ...scrollToApps }]);
    expect(screen.getByTestId(chatTestIds.actionChip)).toHaveTextContent('Scrolled to Apps');
    expect(inList().getByText('Scrolling to the apps.')).toBeInTheDocument();
    expect(repository.requests[0]).toMatchObject({
      v: 2,
      messages: [
        {
          role: 'user',
          content: 'Show the apps',
          page: { tools: ['highlightElement', 'openContact', 'scrollToSection', 'switchLanguage'] },
        },
      ],
    });
    expect(repository.requests[1]?.messages).toMatchObject([
      { role: 'user', content: 'Show the apps' },
      {
        role: 'assistant',
        content: 'Scrolling to the apps.',
        toolCalls: [{ id: 'toolu_1', ...scrollToApps }],
        providerState: 'opaque-state',
      },
      { role: 'user', toolResults: [{ callId: 'toolu_1', result: { ok: true } }] },
    ]);
    expect(screen.getByTestId(chatTestIds.announcer)).toHaveTextContent('Here they are.');
  });

  it('shows the running chip while the action executes and announces the outcome', async () => {
    const { repository, executor, user } = await renderOpenChat('en', { withTools: true });
    let finish: () => void = () => undefined;
    vi.spyOn(executor, 'execute').mockImplementation(
      () => new Promise((resolve) => (finish = () => resolve({ ok: true }))),
    );
    repository.reply(...toolTurn('', scrollToApps)).reply(...answer('Done.'));

    await ask(user, 'Apps please');

    expect(await screen.findByTestId(chatTestIds.actionChip)).toHaveTextContent(
      'Scrolling to Apps…',
    );
    await act(async () => finish());
    await inList().findByText('Done.');
  });

  it('names CV items in chips and runs parallel calls in order', async () => {
    const { repository, executor, user } = await renderOpenChat('en', { withTools: true });
    repository
      .reply(
        ...toolTurn(
          '',
          { name: 'switchLanguage', input: { locale: 'uk' } },
          { name: 'highlightElement', input: { target: 'technology:kotlin' } },
        ),
      )
      .reply(...answer('Ok.'));

    await ask(user, 'Ukrainian and Kotlin');

    await inList().findByText('Ok.');
    expect(executor.executed.map((call) => call.name)).toEqual([
      'switchLanguage',
      'highlightElement',
    ]);
    const chips = screen.getAllByTestId(chatTestIds.actionChip).map((chip) => chip.textContent);
    expect(chips).toEqual([
      'Language switched to Ukrainian',
      expect.stringMatching(/^Showing .*Kotlin/),
    ]);
    expect(repository.requests[1]?.locale).toBe('uk');
  });

  it('answers calls beyond three with invalid_params without running them', async () => {
    const { repository, executor, user } = await renderOpenChat('en', { withTools: true });
    repository
      .reply(...toolTurn('', scrollToApps, scrollToApps, scrollToApps, scrollToApps))
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
    const { repository, executor, user } = await renderOpenChat('en', { withTools: true });
    executor.results.scrollToSection = { ok: false, error: 'not_available' };
    repository.reply(...toolTurn('', scrollToApps)).reply(...answer('Sorry.'));

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
    const { repository, executor, user } = await renderOpenChat('en', { withTools: true });
    repository
      .reply(...toolTurn('', scrollToApps))
      .reply(...toolTurn('', scrollToApps))
      .reply(...toolTurn('', scrollToApps));

    await ask(user, 'Loop');

    expect(await screen.findByTestId(chatTestIds.notice)).toHaveTextContent('couldn’t answer');
    expect(executor.executed).toHaveLength(2);
  });

  it('Ukrainian: chip and card texts', async () => {
    const { repository, user } = await renderOpenChat('uk', { withTools: true });
    repository.reply(...toolTurn('', openTelegram));

    await ask(user, 'Telegram');

    const card = await screen.findByTestId(chatTestIds.confirmation);
    expect(card).toHaveTextContent('Відкрити чат у Telegram з Андрієм?');
    expect(within(card).getByRole('button', { name: 'Підтвердити' })).toBeInTheDocument();
  });
});

describe('chat confirmation card', () => {
  it('asks first, built from CV data; Confirm runs the tool, then the follow-up goes out', async () => {
    const { repository, executor, user } = await renderOpenChat('en', { withTools: true });
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
    const { repository, executor, user } = await renderOpenChat('en', { withTools: true });
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
    const { repository, executor, user } = await renderOpenChat('en', { withTools: true });
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
    const { repository, executor, user } = await renderOpenChat('en', { withTools: true });
    let finish: () => void = () => undefined;
    vi.spyOn(executor, 'execute').mockImplementation(
      () => new Promise((resolve) => (finish = () => resolve({ ok: true }))),
    );
    repository.reply(...toolTurn('', scrollToApps)).reply(...answer('Hi.'));

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
    const { repository, executor, user } = await renderOpenChat('en', { withTools: true });
    repository
      .reply(...toolTurn('Scrolling.', scrollToApps))
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
    const { repository, user } = await renderOpenChat('en', { withTools: true });
    repository.reply(...toolTurn('', scrollToApps)).reply(...answer('Here.'));

    await ask(user, 'Apps');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByTestId(chatTestIds.fab));
    expect(await inList().findByText('Here.')).toBeInTheDocument();
    expect(screen.getByTestId(chatTestIds.actionChip)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('keeps the desktop card open after a visual action', async () => {
    const { repository, user } = await renderOpenChat('en', { withTools: true });
    repository.reply(...toolTurn('', scrollToApps)).reply(...answer('Here.'));

    await ask(user, 'Apps');

    await inList().findByText('Here.');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('chat over the real tool registry', () => {
  it('runs scrollToSection, and openContact after Confirm (not declined)', async () => {
    const cv = await new StaticCvRepository().getCv('en');
    const registry = new AgentToolRegistry(buildAgentToolSpecs(cv));
    const scroll = vi.fn(() => ({ ok: true }) as const);
    const open = vi.fn(() => ({ ok: true }) as const);
    registry.register('scrollToSection', scroll);
    registry.register('openContact', open);
    const repository = new FakeChatRepository();
    const user = userEvent.setup();
    render(
      <AppProviders chatRepository={repository} locale="en" agentRegistry={registry}>
        <ChatRoute />
      </AppProviders>,
    );
    await user.click(screen.getByTestId(chatTestIds.fab));
    repository
      .reply(...toolTurn('', scrollToApps))
      .reply(...answer('Scrolled.'))
      .reply(...toolTurn('', openTelegram))
      .reply(...answer('Opened.'));

    await ask(user, 'Show the apps');
    expect(await inList().findByText('Scrolled.')).toBeInTheDocument();
    expect(scroll).toHaveBeenCalledWith({ section: 'apps' });

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
    const cv = await new StaticCvRepository().getCv('en');
    const registry = new AgentToolRegistry(buildAgentToolSpecs(cv));
    let view: AgentPageView = { activeSection: 'apps', highlighted: 'app:savant' };
    registry.setViewSource(() => view);
    const repository = new FakeChatRepository();
    const user = userEvent.setup();
    render(
      <AppProviders chatRepository={repository} locale="en" agentRegistry={registry}>
        <ChatRoute />
      </AppProviders>,
    );
    await user.click(screen.getByTestId(chatTestIds.fab));
    repository.reply(...answer('One.')).reply(...answer('Two.'));

    await ask(user, 'What is this?');
    expect(await inList().findByText('One.')).toBeInTheDocument();
    expect(repository.requests[0]?.messages.at(-1)).toMatchObject({
      page: { activeSection: 'apps', highlighted: 'app:savant' },
    });

    view = { activeSection: 'about', highlighted: null };
    await ask(user, 'And this?');
    expect(await inList().findByText('Two.')).toBeInTheDocument();
    const [first, , second] = repository.requests[1]?.messages ?? [];
    expect(first).toMatchObject({ page: { activeSection: 'apps', highlighted: 'app:savant' } });
    expect(second).toMatchObject({ page: { activeSection: 'about', highlighted: null } });
  });
});
