import { act, render, screen, waitFor } from '@testing-library/react';
import { AgentToolRegistry } from '../../agent';
import { AppProviders } from '../../app/AppProviders';
import { StaticCvRepository, type CvRepository } from '../../data';
import { buildCvPageToolSpecs, cvPageTargetIds, type AgentToolName } from '../../data/chat';
import { openLink } from '../../shared/agentTarget/pageActions';
import { HomeRoute } from './HomeRoute';
import { homeTestIds } from './testIds';

vi.mock('../../shared/agentTarget/pageActions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../shared/agentTarget/pageActions')>()),
  openLink: vi.fn(),
}));

const call = (name: AgentToolName, input: Record<string, unknown>) => ({ id: 'c1', name, input });
const target = (id: string) => document.querySelector(`[data-agent-id="${id}"]`);

/**
 * Until the chat moves to v4 (CV-111), `AgentProvider` fills the registry from the old CV. A CV
 * that never loads keeps the page's own v4 catalogue in place, as the chat will offer it.
 */
const pendingCv: CvRepository = { getCv: () => new Promise(() => undefined) };

async function renderHome() {
  const page = await new StaticCvRepository().getCvPage();
  const registry = new AgentToolRegistry(buildCvPageToolSpecs(page));
  const view = render(
    <AppProviders agentRegistry={registry} repository={pendingCv} locale="en">
      <HomeRoute />
    </AppProviders>,
  );
  await screen.findByTestId(homeTestIds.name);
  // Handlers register in an effect after the page commits.
  await waitFor(() => expect(registry.available()).toContain('highlightElement'));
  return { registry, view, page };
}

describe('the page agent on the one page', () => {
  const scrollIntoView = vi.fn();
  beforeEach(() => {
    scrollIntoView.mockClear();
    vi.mocked(openLink).mockClear();
    Element.prototype.scrollIntoView = scrollIntoView;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('registers the page tools once the page is shown and unregisters them on unmount', async () => {
    const { registry, view } = await renderHome();
    expect(registry.available()).toEqual(['highlightElement', 'openContact', 'scrollToSection']);

    view.unmount();

    expect(registry.available()).toEqual([]);
  });

  it('puts every catalogue target on the page exactly once, and nothing else', async () => {
    const { page } = await renderHome();
    const ids = cvPageTargetIds(page);
    expect(ids).toHaveLength(38);
    for (const id of ids) {
      expect(document.querySelectorAll(`[data-agent-id="${id}"]`), id).toHaveLength(1);
    }
    expect(document.querySelectorAll('[data-agent-id]')).toHaveLength(ids.length);
  });

  it('the contact targets are the header buttons, not the footer pills', async () => {
    await renderHome();
    expect(target('contact:telegram')).toHaveAttribute('data-testid', homeTestIds.contact);
    for (const link of screen.getAllByTestId(homeTestIds.footerLink)) {
      expect(link).not.toHaveAttribute('data-agent-id');
    }
  });

  it.each(['craft', 'experience', 'contacts'])('scrollToSection scrolls to %s', async (id) => {
    const { registry } = await renderHome();

    expect(await registry.execute(call('scrollToSection', { section: id }))).toEqual({ ok: true });

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(target(`section:${id}`));
  });

  it.each([
    'section:header',
    'impact:design-system',
    'experience:transcenda',
    'app:spoton',
    'skill:ai-engineering',
    'book:siddhartha',
    'contact:linkedin',
  ])('highlightElement scrolls to %s and highlights it for 3 s', async (id) => {
    const { registry } = await renderHome();
    vi.useFakeTimers();

    let result;
    await act(async () => {
      result = await registry.execute(call('highlightElement', { target: id }));
    });

    expect(result).toEqual({ ok: true });
    expect(scrollIntoView.mock.contexts[0]).toBe(target(id));
    expect(target(id)).toHaveAttribute('data-agent-highlighted');
    expect(document.querySelectorAll('[data-agent-highlighted]')).toHaveLength(1);
    expect(registry.view()).toEqual({ activeSection: null, highlighted: id });
    act(() => void vi.advanceTimersByTime(3000));
    expect(target(id)).not.toHaveAttribute('data-agent-highlighted');
  });

  it('openContact needs the visitor to confirm, then opens the contact link', async () => {
    const { registry } = await renderHome();

    expect(await registry.execute(call('openContact', { channel: 'email' }))).toEqual({
      ok: false,
      error: 'declined',
    });
    expect(openLink).not.toHaveBeenCalled();

    registry.setConfirm(() => Promise.resolve(true));
    expect(await registry.execute(call('openContact', { channel: 'email' }))).toEqual({ ok: true });
    expect(await registry.execute(call('openContact', { channel: 'telegram' }))).toEqual({
      ok: true,
    });
    expect(vi.mocked(openLink).mock.calls).toEqual([
      ['mailto:andriipanasiuk@gmail.com'],
      ['https://t.me/+380938977110'],
    ]);
  });
});
