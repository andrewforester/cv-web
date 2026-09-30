import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { AppProviders } from '../../app/AppProviders';
import { FAKE_SHOW_REPLY, FakeShowRepository, ShowRepositoryContext } from '../../data/retro';
import { cvTestIds } from '../cv/testIds';
import { RetroShowRoute } from './RetroShowRoute';
import { RetroStageTestHarness } from './RetroStageTestHarness';
import { retroStrings } from './strings';
import { retroTestIds } from './testIds';

const strings = retroStrings.en;

function renderShow(repository = new FakeShowRepository()) {
  const loaders = { 'ai-chat': vi.fn(() => Promise.resolve()) };
  const onDone = vi.fn();
  render(
    <AppProviders locale="en">
      <ShowRepositoryContext value={repository}>
        <RetroStageTestHarness>
          <RetroShowRoute loaders={loaders} onDone={onDone} />
        </RetroStageTestHarness>
      </ShowRepositoryContext>
    </AppProviders>,
  );
  return { loaders, onDone, repository };
}

/** Moves the fake clock in frames, letting React render and re-arm the runner's timer each time. */
async function advance(ms: number) {
  for (let done = 0; done <= ms; done += 50) {
    await act(() => vi.advanceTimersByTimeAsync(Math.min(50, ms - done)));
  }
}
const layers = () => document.head.querySelectorAll('style[data-retro-layer]');
const chatText = () => screen.getByTestId(retroTestIds.chatLog).textContent ?? '';

describe('retro show screen', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('opens broken, fixes the page step by step and ends on the real site', async () => {
    const { loaders, onDone } = renderShow();
    await advance(0);
    expect(screen.getByTestId(cvTestIds.name)).toBeInTheDocument();
    expect(layers()).toHaveLength(12);
    expect(document.getElementById('oh-snap')).toHaveTextContent(strings.noteTitle);
    expect(screen.queryByTestId(retroTestIds.dock)).not.toBeInTheDocument();
    expect(document.title).toBe(strings.pageTitle);

    await advance(3_000);
    expect(chatText()).toContain(strings.systemJoin);
    expect(screen.queryByTestId(retroTestIds.console)).not.toBeInTheDocument();

    await advance(8_000);
    const liveConsole = screen.getByTestId(retroTestIds.console);
    expect(within(liveConsole).getByText(strings.consolePrompt)).toBeInTheDocument();
    expect(chatText()).toContain(strings.handoff);

    await advance(4_000);
    expect(screen.getByRole('progressbar', { name: 'Step 1 of 7: fonts & colours' })).toBeVisible();

    await advance(70_000);
    expect(loaders['ai-chat']).toHaveBeenCalledTimes(1);
    expect(layers()).toHaveLength(0);
    expect(document.head.querySelector('style[data-retro-host]')).toBeNull();
    expect(document.getElementById('oh-snap')).toBeNull();
    expect(screen.queryAllByTestId(retroTestIds.decoration)).toHaveLength(0);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId(retroTestIds.dock)).not.toBeInTheDocument();
    expect(document.body).not.toHaveClass('docked');
  });

  it('lets the visitor chat with the agent while it fixes', async () => {
    const { repository } = renderShow();
    await advance(3_000);
    const input = screen.getByRole('textbox', { name: strings.inputLabel });
    fireEvent.change(input, { target: { value: 'wow, a marquee!' } });
    fireEvent.submit(input);
    expect(input).toHaveValue('');
    await advance(100);
    expect(chatText()).toContain(`${strings.visitorNick} wow, a marquee!`);
    expect(chatText()).toContain(FAKE_SHOW_REPLY);
    expect(repository.replyInputs[0]?.messages).toEqual([
      { role: 'user', content: 'wow, a marquee!' },
    ]);
  });

  it('minimises a window to its title bar and restores it', async () => {
    renderShow();
    await advance(3_000);
    const chat = screen.getByTestId(retroTestIds.chat);
    const minimise = within(chat).getByTestId(retroTestIds.minimise);
    fireEvent.click(minimise);
    expect(minimise).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(minimise);
    expect(minimise).toHaveAttribute('aria-expanded', 'true');
  });
});
