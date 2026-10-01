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

/**
 * Moves the fake clock in frames, letting React render and re-arm the runner's timer each time;
 * `onFrame` looks at the page after every frame.
 */
async function advance(ms: number, onFrame?: () => void) {
  for (let done = 0; done <= ms; done += 50) {
    await act(() => vi.advanceTimersByTimeAsync(Math.min(50, ms - done)));
    onFrame?.();
  }
}

/** Moves the clock frame by frame until `found` holds (or `ms` have passed). */
async function advanceUntil(found: () => boolean, ms: number) {
  for (let done = 0; done <= ms && !found(); done += 50) {
    await act(() => vi.advanceTimersByTimeAsync(50));
  }
}

/** Every element gets a real box, so the highlight has something to frame (jsdom has no layout). */
function stubLayout() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(
    DOMRect.fromRect({ x: 10, y: 100, width: 200, height: 40 }),
  );
}

function stubReducedMotion() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduce'),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

/** The site's own stylesheet for one test (removed after it, even when the test fails). */
function siteStyle(css: string) {
  const style = document.createElement('style');
  style.dataset.testSite = '';
  style.textContent = css;
  document.head.append(style);
}

const motionClasses = () => [
  document.body.classList.contains('fade'),
  document.documentElement.classList.contains('morph'),
];
const layers = () => document.head.querySelectorAll('style[data-retro-layer]');
const chatText = () => screen.getByTestId(retroTestIds.chatLog).textContent ?? '';

// Each test plays up to the whole ~95 s show in 50 ms frames: CPU-bound, so above the 5 s default.
describe('retro show screen', { timeout: 20_000 }, () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.head.querySelectorAll('style[data-test-site]').forEach((style) => style.remove());
  });

  it('opens broken, fixes the page step by step and ends on the real site', async () => {
    // The site's own token value: the colours step prints it and sets it inline.
    siteStyle(':root { --color-bg: #ffffff; }');
    const inlineBg = () => document.documentElement.style.getPropertyValue('--color-bg');
    const { loaders, onDone } = renderShow();
    await advance(0);
    expect(screen.getByTestId(cvTestIds.name)).toBeInTheDocument();
    expect(layers()).toHaveLength(32);
    expect(document.getElementById('oh-snap')).toHaveTextContent(strings.noteTitle);
    expect(screen.queryByTestId(retroTestIds.dock)).not.toBeInTheDocument();
    expect(document.title).toBe(strings.pageTitle);

    await advance(3_000);
    const chat = screen.getByTestId(retroTestIds.chat);
    expect(within(chat).getByRole('heading', { name: strings.chatTitle })).toBeInTheDocument();
    expect(within(chat).getByText(strings.chatSubtitle)).toBeInTheDocument();
    expect(chatText()).not.toContain(strings.systemJoin);
    expect(screen.queryByTestId(retroTestIds.console)).not.toBeInTheDocument();

    await advance(8_000);
    const liveConsole = screen.getByTestId(retroTestIds.console);
    const log = within(liveConsole).getByRole('log', { name: strings.consoleLabel });
    expect(log).toHaveTextContent('Agent connected to andrew-cv: 36 changes in 8 steps.');
    expect(screen.getByTestId(retroTestIds.consoleErrors)).toHaveTextContent('36');
    expect(screen.getByTestId(retroTestIds.consoleWarnings)).toHaveTextContent('8');
    expect(chatText()).toContain(strings.handoff);

    await advance(4_000);
    expect(log).toHaveTextContent('1/8 fonts');
    expect(log).toHaveTextContent('✓ type-faces removed');
    expect(screen.getByTestId(retroTestIds.consoleErrors)).not.toHaveTextContent('36');

    await advanceUntil(() => inlineBg() !== '', 40_000);
    expect(inlineBg()).toBe('#ffffff');
    expect(log).toHaveTextContent("style.setProperty('--color-bg', '#ffffff')");
    expect(log).toHaveTextContent('✓ base-colors: 1 token set');

    await advance(80_000);
    expect(loaders['ai-chat']).toHaveBeenCalledTimes(1);
    expect(layers()).toHaveLength(0);
    expect(document.head.querySelector('style[data-retro-host]')).toBeNull();
    expect(document.getElementById('oh-snap')).toBeNull();
    expect(screen.queryAllByTestId(retroTestIds.decoration)).toHaveLength(0);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId(retroTestIds.dock)).not.toBeInTheDocument();
    expect(document.body).not.toHaveClass('docked');
    expect(document.documentElement.style.length).toBe(0);
  });

  it('lets the visitor chat with the agent while it fixes', async () => {
    const { repository } = renderShow();
    await advance(3_000);
    const input = screen.getByRole('textbox', { name: strings.inputLabel });
    fireEvent.change(input, { target: { value: 'wow, a marquee!' } });
    fireEvent.submit(input);
    expect(input).toHaveValue('');
    await advance(100);
    expect(chatText()).toContain(`${strings.visitorPrefix} wow, a marquee!`);
    expect(chatText()).toContain(FAKE_SHOW_REPLY);
    expect(repository.replyInputs[0]?.messages).toEqual([
      { role: 'user', content: 'wow, a marquee!' },
    ]);
  });

  it('sends with Enter, keeps Shift+Enter for a new line, and refuses a message over 500', async () => {
    renderShow();
    await advance(3_000);
    const input = screen.getByRole('textbox', { name: strings.inputLabel });
    const meta = screen.getByTestId(retroTestIds.chatMeta);
    const send = screen.getByRole('button', { name: strings.send });
    expect(send).toBeDisabled();
    fireEvent.change(input, { target: { value: 'much better already' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(input).toHaveValue('much better already');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input).toHaveValue('');
    expect(chatText()).toContain(`${strings.visitorPrefix} much better already`);

    fireEvent.change(input, { target: { value: 'x'.repeat(400) } });
    expect(meta).toHaveTextContent('400 / 500');
    expect(meta).toHaveTextContent(strings.disclaimer);
    fireEvent.change(input, { target: { value: 'x'.repeat(501) } });
    expect(meta).toHaveTextContent(strings.tooLong);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    await advance(100);
    expect(screen.getByRole('button', { name: strings.send })).toBeDisabled();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input).toHaveValue('x'.repeat(501));
  });

  it('minimises the chat to its header and restores it from the header', async () => {
    renderShow();
    await advance(3_000);
    const chat = screen.getByTestId(retroTestIds.chat);
    const minimise = within(chat).getByTestId(retroTestIds.minimise);
    expect(minimise).toHaveAccessibleName(strings.minimise);
    fireEvent.click(minimise);
    expect(minimise).toHaveAttribute('aria-expanded', 'false');
    expect(minimise).toHaveAccessibleName(strings.restore);
    expect(screen.getByTestId(retroTestIds.dock)).toHaveClass('chatMinimised');
    fireEvent.click(within(chat).getByRole('heading', { name: strings.chatTitle }));
    expect(minimise).toHaveAttribute('aria-expanded', 'true');
  });

  it('shields the dock from the damage token layers with the live site values', async () => {
    siteStyle(':root { --color-bg: #ffffff; --font-family: Inter; }');
    renderShow();
    await advance(3_000);
    const dock = screen.getByTestId(retroTestIds.dock);
    expect(dock.style.getPropertyValue('--color-bg')).toBe('#ffffff');
    expect(dock.style.getPropertyValue('--font-family')).toBe('Inter');
  });

  it('highlights the current chunk while it types, flashes it at the apply, then lets go', async () => {
    stubLayout();
    renderShow();
    const phases = new Set<string>();
    await advance(10_000);
    await advance(3_000, () => {
      const highlight = screen.queryByTestId(retroTestIds.highlight);
      if (highlight) phases.add(highlight.dataset.phase ?? '');
    });
    expect(phases).toEqual(new Set(['typing', 'applied', 'fading']));
    await advance(95_000);
    expect(screen.queryByTestId(retroTestIds.highlight)).not.toBeInTheDocument();
  });

  it('frames every matching target on screen', async () => {
    stubLayout();
    renderShow();
    await advanceUntil(() => !!screen.queryByTestId(retroTestIds.highlight), 15_000);
    // Chunk 1 targets the name and every section title.
    const boxes = screen.getAllByTestId(retroTestIds.highlightBox);
    const titles = document.querySelectorAll(
      "[data-retro-stage] [data-testid='cv-name'], [data-retro-stage] h2",
    );
    expect(boxes.length).toBe(titles.length);
    expect(boxes[0]).toHaveStyle({ left: '10px', top: '100px', width: '200px', height: '40px' });
    // Several matches: the first one's tag and class, and how many there are.
    const plate = screen.getByTestId(retroTestIds.highlightPlate);
    expect(plate).toHaveTextContent(`h1.name × ${boxes.length}`);
  });

  it('tints the page area for a page-wide chunk, with the body plate', async () => {
    stubLayout();
    renderShow();
    await advanceUntil(() => !!screen.queryByTestId(retroTestIds.highlightPage), 30_000);
    // Chunk 2 (`type-family`) changes the whole page.
    // The stubbed stage is 210 px wide: the page area's size.
    expect(screen.getByTestId(retroTestIds.highlightPlate)).toHaveTextContent(
      `body210 × ${window.innerHeight}`,
    );
  });

  it('switches transitions on only while a chunk applies, and leaves none behind', async () => {
    const { onDone } = renderShow();
    const seen = { fade: false, leaving: false };
    await advance(110_000, () => {
      seen.fade ||= document.body.classList.contains('fade');
      seen.leaving ||= document.querySelector('.leaving') !== null;
    });
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(seen).toEqual({ fade: true, leaving: true });
    expect(motionClasses()).toEqual([false, false]);
  });

  it('closes the windows with the page taking the room back, then unmounts them', async () => {
    const { onDone } = renderShow();
    let closing = false;
    await advance(110_000, () => {
      const dock = screen.queryByTestId(retroTestIds.dock);
      if (!dock?.classList.contains('closing') || closing) return;
      closing = true;
      expect(document.body).not.toHaveClass('docked');
      expect(screen.getByTestId(retroTestIds.console)).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: strings.inputLabel })).toBeDisabled();
      expect(onDone).not.toHaveBeenCalled();
    });
    expect(closing).toBe(true);
    expect(screen.queryByTestId(retroTestIds.dock)).not.toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('runs without motion when the visitor prefers reduced motion', async () => {
    stubReducedMotion();
    const { onDone } = renderShow();
    const seen = { motion: false, leaving: false, closing: false };
    await advance(110_000, () => {
      seen.motion ||= motionClasses().some(Boolean);
      seen.leaving ||= document.querySelector('.leaving') !== null;
      seen.closing ||= document.querySelector('.closing') !== null;
    });
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(seen).toEqual({ motion: false, leaving: false, closing: false });
  });
});
