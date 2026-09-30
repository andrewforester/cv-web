import { RETRO_SHOW } from '../scenario';
import { planShow } from './consolePlan';
import { createLayerHost, readLiveToken } from './layerHost';
import type { PlannedChunk } from './showTypes';

const chunksOf = (plan = planShow(RETRO_SHOW, () => undefined)) =>
  plan.steps.flatMap((step) => step.chunks);
const chunk = (key: string, chunks = chunksOf()): PlannedChunk | undefined =>
  chunks.find((planned) => planned.key === key);

describe('console plan (code shown = code applied)', () => {
  it('types a rule layer verbatim under its target line, one removed line per line of the file', () => {
    const frame = chunk('layer:page-frame');
    const css = RETRO_SHOW.layers['page-frame']?.css ?? '';
    expect(frame?.lines.slice(0, 2)).toEqual([
      { kind: 'comment', text: '// → page' },
      { kind: 'file', text: '--- layers/page-frame.css' },
    ]);
    expect(frame?.lines.slice(2).map(({ text }) => text)).toEqual(
      css.split('\n').filter((line) => line.trim()),
    );
    expect(frame?.lines.slice(2).every(({ kind }) => kind === 'del')).toBe(true);
    expect(frame?.doneText).toBe('page-frame removed');
    expect(frame?.motion).toBe('morph');
  });

  it('types a token layer as a diff against the live values', () => {
    const live: Record<string, string> = { '--color-bg': '#ffffff', '--color-text': '#001670' };
    const colors = chunk('layer:base-colors', chunksOf(planShow(RETRO_SHOW, (name) => live[name])));
    expect(colors?.lines.slice(0, 6)).toEqual([
      { kind: 'comment', text: '// → page' },
      { kind: 'file', text: '--- layers/base-colors.css' },
      { kind: 'del', text: '--color-bg: #ffffcc;' },
      { kind: 'add', text: '--color-bg: #ffffff;' },
      { kind: 'del', text: '--color-text: #000000;' },
      { kind: 'add', text: '--color-text: #001670;' },
    ]);
    // No live value: removing the override is the whole change.
    expect(colors?.lines[6]).toEqual({ kind: 'del', text: '--color-text-secondary: #008000;' });
    expect(colors?.motion).toBe('fade');
  });

  it('generates decoration and module lines from their ids; the module has no target line', () => {
    const note = chunk('decoration:oh-snap');
    const chat = chunk('module:ai-chat');
    expect(note?.lines).toEqual([
      { kind: 'comment', text: '// → note' },
      { kind: 'code', text: "document.getElementById('oh-snap').remove();" },
    ]);
    expect(note?.motion).toBe('leave');
    expect(chat?.lines).toEqual([
      { kind: 'code', text: "const { ChatRoute } = await import('./chat');" },
    ]);
    expect(chat?.doneText).toBe('chat button loaded');
    expect(chat?.motion).toBe('none');
  });

  it("counts each chunk's own characters: it applies at its last one", () => {
    for (const planned of chunksOf()) {
      expect(planned.chars).toBe(planned.lines.reduce((sum, { text }) => sum + text.length, 0));
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
    Reflect.deleteProperty(document, 'startViewTransition');
    vi.restoreAllMocks();
  });

  const injected = () =>
    [...document.head.querySelectorAll<HTMLElement>('style[data-retro-layer]')].map(
      (style) => style.dataset.retroLayer,
    );
  const newHost = () =>
    createLayerHost(document, RETRO_SHOW.layers, { '--retro-tile-stars': 'url("x.svg")' });

  it('injects layers, removes them as they go, and reads live tokens past them', () => {
    const site = document.createElement('style');
    site.textContent =
      ':root { --color-bg: #ffffff; } @media print { :root { --color-bg: #000; } }';
    document.head.append(site);
    const host = newHost();

    host.sync(['base-colors', 'page-background']);
    expect(injected()).toEqual(['base-colors', 'page-background']);
    const hostStyle = document.head.querySelector('style[data-retro-host]')?.textContent;
    expect(hostStyle).toContain('--retro-tile-stars: url("x.svg");');
    expect(hostStyle).toMatch(
      /@media \(prefers-reduced-motion: no-preference\) \{ @keyframes retro-blink/,
    );
    expect(readLiveToken(document, '--color-bg')).toBe('#ffffff');

    host.sync(['page-background']);
    expect(injected()).toEqual(['page-background']);
    host.sync([]);
    expect(injected()).toEqual([]);
    expect(document.head.querySelector('style[data-retro-host]')).toBeNull();
  });

  it('morphs instantly where view transitions are missing', async () => {
    const host = newHost();
    host.sync(['page-frame', 'tech-grid']);
    await host.morph(['tech-grid'], ["[data-retro-stage] [data-agent-id='section:header']"]);
    expect(injected()).toEqual(['tech-grid']);
    expect(document.head.querySelector('style[data-retro-motion]')).toBeNull();
  });

  it('morphs inside a view transition, naming the targets only while it runs', async () => {
    let finish = () => {};
    const finished = new Promise<void>((resolve) => (finish = resolve));
    const seen: { layers: (string | undefined)[]; motion: string | null | undefined }[] = [];
    const start = vi.fn((update: () => void) => {
      const motion = document.head.querySelector('style[data-retro-motion]')?.textContent;
      update();
      seen.push({ layers: injected(), motion });
      return { finished } as ViewTransition;
    });
    Object.defineProperty(document, 'startViewTransition', { value: start, configurable: true });
    vi.spyOn(CSS, 'supports').mockReturnValue(true);
    const host = newHost();
    host.sync(['page-frame', 'tech-grid']);

    const morphing = host.morph(['tech-grid'], ['[data-retro-stage] h2', '#oh-snap']);
    expect(seen).toEqual([
      {
        layers: ['tech-grid'],
        motion: '[data-retro-stage] h2, #oh-snap { view-transition-name: match-element; }',
      },
    ]);
    expect(document.head.querySelector('style[data-retro-motion]')).not.toBeNull();
    finish();
    await morphing;
    expect(document.head.querySelector('style[data-retro-motion]')).toBeNull();
  });
});
