import { StaticCvRepository } from '../data';
import { buildCvPageToolSpecs, type AgentToolName } from '../data/chat';
import { AgentToolRegistry } from './AgentToolRegistry';

async function makeRegistry() {
  const page = await new StaticCvRepository().getCvPage();
  return new AgentToolRegistry(buildCvPageToolSpecs(page));
}
const call = (name: AgentToolName, input: Record<string, unknown>) => ({ id: 'c1', name, input });

describe('AgentToolRegistry', () => {
  it('runs a registered handler with valid input', async () => {
    const registry = await makeRegistry();
    const handler = vi.fn(() => ({ ok: true as const }));
    registry.register('scrollToSection', handler);

    expect(await registry.execute(call('scrollToSection', { section: 'impact' }))).toEqual({
      ok: true,
    });
    expect(handler).toHaveBeenCalledWith({ section: 'impact' });
  });

  it('answers invalid_params without running the handler', async () => {
    const registry = await makeRegistry();
    const handler = vi.fn(() => ({ ok: true as const }));
    registry.register('scrollToSection', handler);

    for (const input of [{ section: 'x' }, {}, { section: 'impact', more: 'y' }]) {
      expect(await registry.execute(call('scrollToSection', input))).toEqual({
        ok: false,
        error: 'invalid_params',
      });
    }
    expect(await registry.execute(call('nope' as AgentToolName, { section: 'impact' }))).toEqual({
      ok: false,
      error: 'invalid_params',
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('answers not_available for a tool that is not mounted, and after unregistering', async () => {
    const registry = await makeRegistry();
    const input = { section: 'impact' };
    expect(await registry.execute(call('scrollToSection', input))).toEqual({
      ok: false,
      error: 'not_available',
    });

    const unregister = registry.register('scrollToSection', () => ({ ok: true }));
    expect(registry.available()).toEqual(['scrollToSection']);
    unregister();
    expect(registry.available()).toEqual([]);
    expect((await registry.execute(call('scrollToSection', input))).ok).toBe(false);
  });

  it('keeps a newer registration when an older one unregisters', async () => {
    const registry = await makeRegistry();
    const first = registry.register('scrollToSection', () => ({ ok: true }));
    registry.register('scrollToSection', () => ({ ok: true }));
    first();
    expect(registry.available()).toEqual(['scrollToSection']);
  });

  it('passes handler results through, including unknown_target, and maps throws to failed', async () => {
    const registry = await makeRegistry();
    registry.register('highlightElement', () => ({ ok: false, error: 'unknown_target' }));
    registry.register('scrollToSection', () => {
      throw new Error('boom');
    });

    expect(await registry.execute(call('highlightElement', { target: 'section:impact' }))).toEqual({
      ok: false,
      error: 'unknown_target',
    });
    expect(await registry.execute(call('scrollToSection', { section: 'impact' }))).toEqual({
      ok: false,
      error: 'failed',
    });
  });

  it('asks before running a confirm tool and declines without an answer or on "no"', async () => {
    const registry = await makeRegistry();
    const handler = vi.fn(() => ({ ok: true as const }));
    registry.register('openContact', handler);
    const input = { channel: 'whatsapp' };

    expect(await registry.execute(call('openContact', input))).toEqual({
      ok: false,
      error: 'declined',
    });

    const confirm = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    registry.setConfirm(confirm);
    expect((await registry.execute(call('openContact', input))).ok).toBe(false);
    expect(handler).not.toHaveBeenCalled();
    expect(await registry.execute(call('openContact', input))).toEqual({ ok: true });
    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ input, spec: expect.objectContaining({ name: 'openContact' }) }),
    );
  });

  it('reads the view from the screen when asked, and nothing once it is gone', async () => {
    const registry = await makeRegistry();
    expect(registry.view()).toEqual({ activeSection: null, highlighted: null });

    let section: 'impact' | 'about' = 'impact';
    const clear = registry.setViewSource(() => ({
      activeSection: section,
      highlighted: 'section:impact',
    }));
    expect(registry.view()).toEqual({ activeSection: 'impact', highlighted: 'section:impact' });
    section = 'about';
    expect(registry.view().activeSection).toBe('about');

    const newer = registry.setViewSource(() => ({ activeSection: 'header', highlighted: null }));
    clear();
    expect(registry.view().activeSection).toBe('header');
    newer();
    expect(registry.view()).toEqual({ activeSection: null, highlighted: null });
  });
});
