import { act, render, screen, waitFor } from '@testing-library/react';
import { AgentToolRegistry } from '../../agent';
import { AgentRegistryContext } from '../../agent/AgentRegistryContext';
import { AppProviders } from '../../app/AppProviders';
import { StaticCvRepository } from '../../data';
import { buildProfileToolSpecs, profileTargetIds, type AgentToolName } from '../../data/chat';
import { openLink } from '../../shared/agentTarget/pageActions';
import { forestTestIds } from '../../shared/forest/testIds';
import { ProfileRoute } from './ProfileRoute';

vi.mock('../../shared/agentTarget/pageActions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../shared/agentTarget/pageActions')>()),
  openLink: vi.fn(),
}));

const call = (name: AgentToolName, input: Record<string, unknown>) => ({ id: 'c1', name, input });
const target = (id: string) => document.querySelector(`[data-agent-id="${id}"]`);

/** Lays the page out for the reading line: `section:<above>` just above it, the rest below. */
function stubSectionTops(above: string) {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const id = this.getAttribute('data-agent-id');
    const top = id === `section:${above}` ? 100 : id === 'section:header' ? -2000 : 2000;
    return { top } as DOMRect;
  });
}

async function renderProfile(locale: 'en' | 'uk' = 'en') {
  const profile = await new StaticCvRepository().getProfile('en');
  const registry = new AgentToolRegistry(buildProfileToolSpecs(profile));
  // The app's `AgentProvider` holds the one page's catalogue (ADR-0006); this retired page keeps
  // its own until the Cleanup task deletes it.
  const view = render(
    <AppProviders locale={locale}>
      <AgentRegistryContext value={registry}>
        <ProfileRoute />
      </AgentRegistryContext>
    </AppProviders>,
  );
  await screen.findByTestId(forestTestIds.name);
  // Handlers register in an effect after the profile commits.
  await waitFor(() => expect(registry.available()).toContain('highlightElement'));
  return { registry, view, profile };
}

describe('/new page agent tools', () => {
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

  it('registers the page tools once the profile is shown and unregisters them on unmount', async () => {
    const { registry, view } = await renderProfile();
    expect(registry.available()).toEqual(['highlightElement', 'openContact', 'scrollToSection']);

    view.unmount();

    expect(registry.available()).toEqual([]);
  });

  it.each(['en', 'uk'] as const)(
    'puts every catalogue target on the page exactly once (%s)',
    async (locale) => {
      const { profile } = await renderProfile(locale);
      for (const id of profileTargetIds(profile)) {
        expect(document.querySelectorAll(`[data-agent-id="${id}"]`), id).toHaveLength(1);
      }
      expect(document.querySelectorAll('[data-agent-id]')).toHaveLength(
        profileTargetIds(profile).length,
      );
    },
  );

  it('the "Live AI CV" contact row is not a target', async () => {
    await renderProfile();
    const askRow = document.querySelector('a[href="#ask"]');
    expect(askRow).not.toBeNull();
    expect(askRow).not.toHaveAttribute('data-agent-id');
  });

  it('scrollToSection scrolls to a /new section', async () => {
    const { registry } = await renderProfile();

    expect(await registry.execute(call('scrollToSection', { section: 'impact' }))).toEqual({
      ok: true,
    });

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(target('section:impact'));
  });

  it("refuses a CV section: it is not in /new's catalogue", async () => {
    const { registry } = await renderProfile();
    expect(await registry.execute(call('scrollToSection', { section: 'summary' }))).toEqual({
      ok: false,
      error: 'invalid_params',
    });
  });

  it.each([
    'impact:users',
    'experience:transcenda',
    'experience:samsung',
    'app:cync',
    'skill:ai-engineering',
    'book:antifragile',
    'contact:email',
    'section:footer',
  ])('highlightElement scrolls to %s and highlights it for 3 s', async (id) => {
    const { registry } = await renderProfile();
    vi.useFakeTimers();

    let result;
    await act(async () => {
      result = await registry.execute(call('highlightElement', { target: id }));
    });

    expect(result).toEqual({ ok: true });
    expect(scrollIntoView.mock.contexts[0]).toBe(target(id));
    expect(target(id)).toHaveAttribute('data-agent-highlighted');
    expect(document.querySelectorAll('[data-agent-highlighted]')).toHaveLength(1);
    act(() => void vi.advanceTimersByTime(3000));
    expect(target(id)).not.toHaveAttribute('data-agent-highlighted');
  });

  it('openContact needs the visitor to confirm, then opens the email or phone link', async () => {
    const { registry } = await renderProfile();

    expect(await registry.execute(call('openContact', { channel: 'email' }))).toEqual({
      ok: false,
      error: 'declined',
    });
    expect(openLink).not.toHaveBeenCalled();

    registry.setConfirm(() => Promise.resolve(true));
    expect(await registry.execute(call('openContact', { channel: 'email' }))).toEqual({ ok: true });
    expect(await registry.execute(call('openContact', { channel: 'phone' }))).toEqual({ ok: true });
    expect(vi.mocked(openLink).mock.calls).toEqual([
      ['mailto:andriipanasiuk@gmail.com'],
      ['tel:+380938977110'],
    ]);
    expect(await registry.execute(call('openContact', { channel: 'telegram' }))).toEqual({
      ok: false,
      error: 'invalid_params',
    });
  });

  it("offers the section in view and the highlighted target to the chat's snapshot", async () => {
    stubSectionTops('impact');
    const { registry, view } = await renderProfile();
    expect(registry.view()).toEqual({ activeSection: 'impact', highlighted: null });

    await act(async () => {
      await registry.execute(call('highlightElement', { target: 'impact:users' }));
    });
    expect(registry.view()).toEqual({ activeSection: 'impact', highlighted: 'impact:users' });

    view.unmount();
    expect(registry.view()).toEqual({ activeSection: null, highlighted: null });
  });
});
