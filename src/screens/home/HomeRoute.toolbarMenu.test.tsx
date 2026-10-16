import { act, fireEvent, render, screen } from '@testing-library/react';
import { AppProviders } from '../../app/AppProviders';
import { HomeRoute } from './HomeRoute';
import { homeTestIds } from './testIds';

// The toolbar's menu: on narrow screens the sections fold into a list opened from the bar.

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
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
}

const toggle = () => screen.getByTestId(homeTestIds.toolbarMenu);
const current = () => screen.getByTestId(homeTestIds.toolbarCurrent);
const bar = () => screen.getByTestId(homeTestIds.toolbar);
const open = () => toggle().getAttribute('aria-expanded') === 'true';

describe('the toolbar menu', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => vi.restoreAllMocks());

  it('names the handle on the header, then the section being read', async () => {
    stubSectionTops('header');
    await renderHome();
    expect(bar()).toHaveTextContent('~/andrew.panasiuk/cv');
    expect(screen.queryByTestId(homeTestIds.toolbarCurrent)).toBeNull();

    stubSectionTops('impact');
    act(() => {
      fireEvent.scroll(window);
    });
    await vi.waitFor(() => expect(current()).toHaveTextContent('impact'));
  });

  it('opens the list of sections and closes it once one is picked', async () => {
    await renderHome();
    expect(open()).toBe(false);
    expect(toggle()).toHaveAttribute(
      'aria-controls',
      screen.getByTestId(homeTestIds.toolbarList).id,
    );

    fireEvent.click(toggle());
    expect(open()).toBe(true);
    expect(screen.getByTestId(homeTestIds.toolbarList)).toHaveAttribute('data-open');

    fireEvent.click(screen.getByRole('button', { name: 'craft' }));
    expect(open()).toBe(false);
    expect(current()).toHaveTextContent('craft');
  });

  it('closes on Escape, giving focus back to the toggle', async () => {
    await renderHome();
    fireEvent.click(toggle());

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(open()).toBe(false);
    expect(toggle()).toHaveFocus();
  });

  it('closes on a tap outside the bar, not inside it', async () => {
    await renderHome();
    fireEvent.click(toggle());

    fireEvent.pointerDown(screen.getByTestId(homeTestIds.toolbarList));
    expect(open()).toBe(true);
    fireEvent.pointerDown(screen.getByTestId(homeTestIds.name));
    expect(open()).toBe(false);
  });
});
