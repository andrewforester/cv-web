import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { AppProviders } from '../../app/AppProviders';
import { HomeRoute } from './HomeRoute';
import { homeTestIds } from './testIds';

const LABELS = [
  'skills',
  'impact',
  'projects',
  'experience',
  'craft',
  'process',
  'education',
  'about',
  'contact',
];

/** Lays the page out for the reading line: `section:<above>` just above it, the rest below. */
function stubSectionTops(above: string) {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const id = this.getAttribute('data-agent-id');
    const top = id === `section:${above}` ? 100 : id === 'section:header' ? -3000 : 2000;
    return { top } as DOMRect;
  });
}

async function renderHome() {
  render(
    <AppProviders>
      <HomeRoute />
    </AppProviders>,
  );
  await screen.findByTestId(homeTestIds.name);
  return screen.getByTestId(homeTestIds.toolbar);
}

/** Lets the first measure (a frame after the page renders) run. */
const nextFrame = () => act(() => new Promise((resolve) => setTimeout(resolve, 50)));

const links = () => screen.getAllByTestId(homeTestIds.toolbarLink);
const current = () => links().filter((link) => link.getAttribute('aria-current') === 'true');

describe('the page toolbar', () => {
  const scrollIntoView = vi.fn();
  beforeEach(() => {
    scrollIntoView.mockClear();
    Element.prototype.scrollIntoView = scrollIntoView;
  });
  afterEach(() => vi.restoreAllMocks());

  it('shows the handle and the page sections in page order', async () => {
    const toolbar = await renderHome();

    expect(toolbar).toHaveAccessibleName('Sections');
    expect(within(toolbar).getByText('~/andrew.panasiuk/cv')).toBeInTheDocument();
    expect(links().map((link) => link.textContent)).toEqual(LABELS);
    const onPage = [...document.querySelectorAll('[data-agent-id^="section:"]')]
      .map((section) => section.getAttribute('data-agent-id')?.slice('section:'.length))
      .filter((id) => id !== 'header');
    expect(links().map((link) => link.dataset.section)).toEqual(onPage);
  });

  it('takes the handle out of the meta bar', async () => {
    await renderHome();
    expect(screen.getByTestId(homeTestIds.metaBar)).not.toHaveTextContent('~/andrew.panasiuk/cv');
  });

  it('marks nothing on the header, then the section being read as the page scrolls', async () => {
    stubSectionTops('header');
    await renderHome();
    await nextFrame();
    expect(current()).toEqual([]);

    stubSectionTops('experience');
    act(() => {
      fireEvent.scroll(window);
    });

    await vi.waitFor(() =>
      expect(current().map((link) => link.textContent)).toEqual(['experience']),
    );
  });

  it('follows a layout change that comes without a scroll (the page resizing under it)', async () => {
    let resized = () => {};
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resized = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    stubSectionTops('header');
    await renderHome();
    await nextFrame();
    expect(current()).toEqual([]);

    stubSectionTops('about');
    act(() => resized());

    await vi.waitFor(() => expect(current().map((link) => link.textContent)).toEqual(['about']));
    vi.unstubAllGlobals();
  });

  it('keeps the picked section marked while the page scrolls to it', async () => {
    await renderHome();
    fireEvent.click(screen.getByRole('button', { name: 'contact' }));

    // On its way down the page passes other sections; the mark stays on the pick.
    stubSectionTops('experience');
    act(() => {
      fireEvent.scroll(window);
    });
    await nextFrame();
    expect(current().map((link) => link.textContent)).toEqual(['contact']);

    // Once the scroll ends the mark follows the page again.
    act(() => {
      fireEvent(window, new Event('scrollend'));
    });
    await vi.waitFor(() =>
      expect(current().map((link) => link.textContent)).toEqual(['experience']),
    );
  });

  it('scrolls to the section the visitor picks and marks it', async () => {
    await renderHome();

    fireEvent.click(screen.getByRole('button', { name: 'process' }));

    const loop = document.querySelector('[data-agent-id="section:loop"]');
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(loop);
    expect(current().map((link) => link.textContent)).toEqual(['process']);
  });
});
