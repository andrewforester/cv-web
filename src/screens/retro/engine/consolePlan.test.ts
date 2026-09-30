import { layersFromDisk } from '../layerFilesTestHarness';
import { RETRO_SHOW } from '../scenario';
import { planShow, type ShowSource } from './consolePlan';
import { createLayerHost, readLiveToken } from './layerHost';

let source: ShowSource;
beforeAll(async () => {
  source = { ...RETRO_SHOW, layers: await layersFromDisk() };
});

describe('console plan (code shown = code applied)', () => {
  it('types a rule layer verbatim, one removed line per non-blank line of the file', () => {
    const plan = planShow(source, () => undefined);
    const layout = plan.steps[1]?.effects[0];
    const css = source.layers['layout-shift']?.css ?? '';
    expect(layout?.lines[0]).toEqual({ kind: 'file', text: '--- layers/layout-shift.css' });
    expect(layout?.lines.slice(1).map(({ text }) => text)).toEqual(
      css.split('\n').filter((line) => line.trim()),
    );
    expect(layout?.lines.slice(1).every(({ kind }) => kind === 'del')).toBe(true);
    expect(layout?.doneText).toBe('layout-shift removed');
  });

  it('types a token layer as a diff against the live values', () => {
    const live: Record<string, string> = { '--color-bg': '#ffffff', '--color-text': '#001670' };
    const plan = planShow(source, (name) => live[name]);
    const colors = plan.steps[0]?.effects.find(({ key }) => key === 'layer:tokens-colors');
    expect(colors?.lines.slice(1, 5)).toEqual([
      { kind: 'del', text: '--color-bg: #ffffcc;' },
      { kind: 'add', text: '--color-bg: #ffffff;' },
      { kind: 'del', text: '--color-text: #000000;' },
      { kind: 'add', text: '--color-text: #001670;' },
    ]);
    // No live value: removing the override is the whole change.
    expect(colors?.lines[5]).toEqual({ kind: 'del', text: '--color-text-secondary: #008000;' });
    expect(colors?.lines[6]?.kind).toBe('del');
  });

  it('generates decoration and module lines from their ids', () => {
    const rest = planShow(source, () => undefined).steps[2];
    const note = rest?.effects.find(({ key }) => key === 'decoration:oh-snap');
    const chat = rest?.effects.find(({ key }) => key === 'module:ai-chat');
    expect(note?.lines).toEqual([
      { kind: 'code', text: "document.getElementById('oh-snap').remove();" },
    ]);
    expect(chat?.lines).toEqual([
      { kind: 'code', text: "const { ChatRoute } = await import('./chat');" },
    ]);
    expect(chat?.doneText).toBe('chat button loaded');
  });

  it('ends each effect where its own text ends, so it applies right there', () => {
    const step = planShow(source, () => undefined).steps[0];
    const ends = step?.effects.map(({ end }) => end) ?? [];
    expect(ends).toEqual([...ends].sort((a, b) => a - b));
    expect(ends.at(-1)).toBe(step?.chars);
    const first = step?.effects[0];
    expect(first?.end).toBe(first?.lines.reduce((sum, { text }) => sum + text.length, 0));
  });

  it('lists every layer and decoration the show starts with', () => {
    const plan = planShow(source, () => undefined);
    expect(plan.layers).toHaveLength(Object.keys(source.layers).length);
    expect(plan.decorations).toEqual(['oh-snap', 'top-bar', 'page-footer']);
  });
});

describe('layer host', () => {
  afterEach(() => document.head.replaceChildren());

  it('injects layers, removes them as they go, and reads live tokens past them', () => {
    const site = document.createElement('style');
    site.textContent =
      ':root { --color-bg: #ffffff; } @media print { :root { --color-bg: #000; } }';
    document.head.append(site);
    const host = createLayerHost(document, source.layers, { '--retro-tile-stars': 'url("x.svg")' });

    host.sync(['tokens-colors', 'page-colors']);
    const injected = () =>
      [...document.head.querySelectorAll<HTMLElement>('style[data-retro-layer]')].map(
        (style) => style.dataset.retroLayer,
      );
    expect(injected()).toEqual(['tokens-colors', 'page-colors']);
    expect(document.head.querySelector('style[data-retro-host]')?.textContent).toContain(
      '--retro-tile-stars: url("x.svg");',
    );
    expect(readLiveToken(document, '--color-bg')).toBe('#ffffff');

    host.sync(['page-colors']);
    expect(injected()).toEqual(['page-colors']);
    host.sync([]);
    expect(injected()).toEqual([]);
    expect(document.head.querySelector('style[data-retro-host]')).toBeNull();
  });
});
