import { RETRO_SHOW } from '../scenario';
import { literal, planShow } from './consolePlan';
import { createLayerHost, readLiveToken } from './layerHost';
import type { PlannedChunk, TokenValue } from './showTypes';

const chunksOf = (plan = planShow(RETRO_SHOW, () => undefined)) =>
  plan.steps.flatMap((step) => step.chunks);
const chunk = (key: string, chunks = chunksOf()): PlannedChunk | undefined =>
  chunks.find((planned) => planned.key === key);

describe('console plan (code shown = code applied)', () => {
  it('types a rule layer as the removal of its own <style>, under its target comment', () => {
    const frame = chunk('layer:page-frame');
    expect(frame?.input).toEqual([
      '// → page',
      `document.querySelector('style[data-retro-layer="page-frame"]').remove()`,
    ]);
    expect(frame?.doneText).toBe('page-frame removed');
    expect(frame?.tokens).toEqual([]);
    expect(frame?.motion).toBe('morph');
  });

  it('types a token layer as setProperty calls with the live values, the ones the engine sets', () => {
    const live: Record<string, string> = { '--color-card': '#ffffff', '--color-ink': '#16131c' };
    const colors = chunk('layer:base-colors', chunksOf(planShow(RETRO_SHOW, (name) => live[name])));
    // No live value (`--color-ink-2` here): dropping the layer is the whole change.
    expect(colors?.input).toEqual([
      '// → page',
      'const { style } = document.documentElement',
      "style.setProperty('--color-card', '#ffffff')",
      "style.setProperty('--color-ink', '#16131c')",
    ]);
    expect(colors?.tokens).toEqual([
      ['--color-card', '#ffffff'],
      ['--color-ink', '#16131c'],
    ]);
    expect(colors?.doneText).toBe('base-colors: 2 tokens set');
    expect(colors?.motion).toBe('fade');
  });

  it('prints a value with a single quote in double quotes, so the input stays valid JS', () => {
    const family = "'Inter', system-ui, sans-serif";
    const planned = chunk('layer:type-family', chunksOf(planShow(RETRO_SHOW, () => family)));
    expect(planned?.input).toContain(`style.setProperty('--font-sans', "${family}")`);
    expect(literal('a\\b')).toBe('"a\\\\b"');
  });

  it('generates decoration and module commands from their ids; the module has no target', () => {
    const note = chunk('decoration:oh-snap');
    const chat = chunk('module:ai-chat');
    expect(note?.input).toEqual(['// → note', "document.getElementById('oh-snap').remove()"]);
    expect(note?.doneText).toBe('#oh-snap removed');
    expect(note?.motion).toBe('leave');
    expect(chat?.input).toEqual(["const { ChatRoute } = await import('./chat')"]);
    expect(chat?.doneText).toBe('chat button loaded');
    expect(chat?.motion).toBe('none');
  });

  it("counts each chunk's own characters: it applies at its last one", () => {
    for (const planned of chunksOf()) {
      expect(planned.chars).toBe(planned.input.reduce((sum, line) => sum + line.length, 0));
    }
  });

  it('plans 8 steps of 36 chunks and lists every layer and decoration the show starts with', () => {
    const plan = planShow(RETRO_SHOW, () => undefined);
    expect(plan.steps).toHaveLength(8);
    expect(chunksOf(plan)).toHaveLength(36);
    expect(plan.layers).toHaveLength(Object.keys(RETRO_SHOW.layers).length);
    expect(plan.decorations).toEqual(['oh-snap', 'top-bar', 'page-footer']);
  });
});

describe('layer host', () => {
  afterEach(() => {
    document.head.replaceChildren();
    document.documentElement.removeAttribute('style');
    Reflect.deleteProperty(document, 'startViewTransition');
    vi.restoreAllMocks();
  });

  const injected = () =>
    [...document.head.querySelectorAll<HTMLElement>('style[data-retro-layer]')].map(
      (style) => style.dataset.retroLayer,
    );
  const styles = (layers: string[], tokens: TokenValue[] = []) => ({ layers, tokens });
  const inlineToken = (name: string) => document.documentElement.style.getPropertyValue(name);
  const newHost = () =>
    createLayerHost(document, RETRO_SHOW.layers, { '--retro-tile-stars': 'url("x.svg")' });

  it('injects layers, removes them as they go, and reads live tokens past them', () => {
    const site = document.createElement('style');
    site.textContent =
      ':root { --color-card: #ffffff; } @media print { :root { --color-card: #000; } }';
    document.head.append(site);
    const host = newHost();

    host.sync(styles(['base-colors', 'page-background']));
    expect(injected()).toEqual(['base-colors', 'page-background']);
    const hostStyle = document.head.querySelector('style[data-retro-host]')?.textContent;
    expect(hostStyle).toContain('--retro-tile-stars: url("x.svg");');
    expect(hostStyle).toMatch(
      /@media \(prefers-reduced-motion: no-preference\) \{ @keyframes retro-blink/,
    );
    expect(readLiveToken(document, '--color-card')).toBe('#ffffff');

    host.sync(styles(['page-background']));
    expect(injected()).toEqual(['page-background']);
    host.sync(styles([]));
    expect(injected()).toEqual([]);
    expect(document.head.querySelector('style[data-retro-host]')).toBeNull();
  });

  it("sets the token chunks' properties inline and clears only its own", () => {
    const root = document.documentElement;
    root.style.setProperty('--not-the-show', '1px');
    const host = newHost();
    host.sync(
      styles(
        [],
        [
          ['--color-card', '#ffffff'],
          ['--font-sans', 'Inter'],
        ],
      ),
    );
    expect(inlineToken('--color-card')).toBe('#ffffff');
    expect(inlineToken('--font-sans')).toBe('Inter');

    host.sync(styles([], [['--color-card', '#ffffff']]));
    expect(inlineToken('--font-sans')).toBe('');
    host.dispose();
    expect(inlineToken('--color-card')).toBe('');
    expect(inlineToken('--not-the-show')).toBe('1px');
  });

  it('morphs instantly where view transitions are missing', async () => {
    const host = newHost();
    host.sync(styles(['page-frame', 'skills-grid']));
    await host.morph(styles(['skills-grid']), [
      "[data-retro-stage] [data-testid='home-header']",
    ]);
    expect(injected()).toEqual(['skills-grid']);
    expect(document.head.querySelector('style[data-retro-motion]')).toBeNull();
  });

  it('morphs inside a view transition, naming the targets only while it runs', async () => {
    let finish = () => {};
    const finished = new Promise<void>((resolve) => (finish = resolve));
    const seen: { layers: (string | undefined)[]; motion?: string | null; token: string }[] = [];
    const start = vi.fn((update: () => void) => {
      const motion = document.head.querySelector('style[data-retro-motion]')?.textContent;
      const before = inlineToken('--font-sans');
      update();
      seen.push({
        layers: injected(),
        motion,
        token: `${before}→${inlineToken('--font-sans')}`,
      });
      return { finished } as ViewTransition;
    });
    Object.defineProperty(document, 'startViewTransition', { value: start, configurable: true });
    vi.spyOn(CSS, 'supports').mockReturnValue(true);
    const host = newHost();
    host.sync(styles(['page-frame', 'skills-grid']));

    const morphing = host.morph(styles(['skills-grid'], [['--font-sans', 'Inter']]), [
      '[data-retro-stage] h2',
      '#oh-snap',
    ]);
    // The tokens change inside the transition, with the layers: the old snapshot is the old look.
    expect(seen).toEqual([
      {
        layers: ['skills-grid'],
        motion: '[data-retro-stage] h2, #oh-snap { view-transition-name: match-element; }',
        token: '→Inter',
      },
    ]);
    expect(document.head.querySelector('style[data-retro-motion]')).not.toBeNull();
    finish();
    await morphing;
    expect(document.head.querySelector('style[data-retro-motion]')).toBeNull();
  });
});
