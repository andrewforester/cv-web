import { act, render, screen, waitFor } from '@testing-library/react';
import { AgentToolRegistry } from '../../agent';
import { AppProviders } from '../../app/AppProviders';
import { StaticCvRepository } from '../../data';
import { buildAgentToolSpecs, type AgentToolName } from '../../data/chat';
import { CvRoute } from './CvRoute';
import { forestTestIds } from '../../shared/forest/testIds';

const call = (name: AgentToolName, input: Record<string, unknown>) => ({ id: 'c1', name, input });
const target = (id: string) => document.querySelector(`[data-agent-id="${id}"]`);

async function renderCv() {
  const cv = await new StaticCvRepository().getCv('en');
  const registry = new AgentToolRegistry(buildAgentToolSpecs(cv));
  const view = render(
    <AppProviders agentRegistry={registry} locale="en">
      <CvRoute />
    </AppProviders>,
  );
  await screen.findByTestId(forestTestIds.name);
  // Handlers register in an effect after the CV commits.
  await waitFor(() => expect(registry.available()).toContain('highlightElement'));
  return { registry, view };
}

describe('CV page agent tools', () => {
  const scrollIntoView = vi.fn();
  beforeEach(() => {
    scrollIntoView.mockClear();
    Element.prototype.scrollIntoView = scrollIntoView;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('registers the CV tools once the CV is shown and unregisters them on unmount', async () => {
    const { registry, view } = await renderCv();
    expect(registry.available()).toEqual(['highlightElement', 'openContact', 'scrollToSection']);

    view.unmount();

    expect(registry.available()).toEqual([]);
    expect(await registry.execute(call('scrollToSection', { section: 'apps' }))).toEqual({
      ok: false,
      error: 'not_available',
    });
  });

  it('marks sections and items with data-agent-id', async () => {
    await renderCv();
    for (const id of [
      'section:header',
      'section:summary',
      'section:technologies',
      'section:latest-experience',
      'section:apps',
      'section:education',
      'section:about',
      'section:previous-experience',
      'technology:kotlin',
      'experience:transcenda',
      'experience:samsung',
      'app:savant',
      'book:antifragile',
      'contact:email',
      'contact:phone',
      'contact:whatsapp',
      'contact:telegram',
    ]) {
      expect(target(id), id).not.toBeNull();
    }
  });

  it('scrollToSection scrolls the section smoothly', async () => {
    const { registry } = await renderCv();

    expect(await registry.execute(call('scrollToSection', { section: 'apps' }))).toEqual({
      ok: true,
    });

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(target('section:apps'));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('scrolls instantly under prefers-reduced-motion', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const { registry } = await renderCv();

    await registry.execute(call('scrollToSection', { section: 'about' }));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' });
  });

  it('highlightElement scrolls to the card, highlights it and clears after 3 s', async () => {
    const { registry } = await renderCv();
    vi.useFakeTimers();

    let result;
    await act(async () => {
      result = await registry.execute(call('highlightElement', { target: 'technology:kotlin' }));
    });

    expect(result).toEqual({ ok: true });
    expect(scrollIntoView.mock.contexts[0]).toBe(target('technology:kotlin'));
    expect(target('technology:kotlin')).toHaveAttribute('data-agent-highlighted');
    expect(document.querySelectorAll('[data-agent-highlighted]')).toHaveLength(1);

    act(() => void vi.advanceTimersByTime(2999));
    expect(target('technology:kotlin')).toHaveAttribute('data-agent-highlighted');
    act(() => void vi.advanceTimersByTime(1));
    expect(target('technology:kotlin')).not.toHaveAttribute('data-agent-highlighted');
  });

  it('moves the highlight when a second target is highlighted', async () => {
    const { registry } = await renderCv();

    await act(async () => {
      await registry.execute(call('highlightElement', { target: 'app:cync' }));
      await registry.execute(call('highlightElement', { target: 'section:about' }));
    });

    expect(target('app:cync')).not.toHaveAttribute('data-agent-highlighted');
    expect(target('section:about')).toHaveAttribute('data-agent-highlighted');
  });

  it('answers unknown_target when the element is missing and invalid_params for a bad id', async () => {
    const { registry } = await renderCv();
    target('technology:kotlin')?.removeAttribute('data-agent-id');

    expect(
      await registry.execute(call('highlightElement', { target: 'technology:kotlin' })),
    ).toEqual({ ok: false, error: 'unknown_target' });
    expect(
      await registry.execute(call('highlightElement', { target: 'technology:ghost' })),
    ).toEqual({ ok: false, error: 'invalid_params' });
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('openContact needs the visitor to confirm, then opens the CV link', async () => {
    const { registry } = await renderCv();
    const open = vi.fn();
    vi.stubGlobal('open', open);

    expect(await registry.execute(call('openContact', { channel: 'telegram' }))).toEqual({
      ok: false,
      error: 'declined',
    });
    expect(open).not.toHaveBeenCalled();

    registry.setConfirm(() => Promise.resolve(true));
    expect(await registry.execute(call('openContact', { channel: 'telegram' }))).toEqual({
      ok: true,
    });
    expect(open).toHaveBeenCalledWith(expect.stringContaining('t.me'), '_blank', 'noopener');
  });
});
