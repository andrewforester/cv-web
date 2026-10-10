import { sectionInView } from './pageActions';

const SECTIONS = ['header', 'summary', 'apps', 'about'] as const;

/** Puts `section:<id>` elements on the page at the given viewport tops. */
function layout(tops: Partial<Record<string, number>>) {
  document.body.innerHTML = Object.keys(tops)
    .map((id) => `<section data-agent-id="section:${id}"></section>`)
    .join('');
  for (const [id, top] of Object.entries(tops)) {
    const element = document.querySelector(`[data-agent-id="section:${id}"]`);
    if (element) element.getBoundingClientRect = () => ({ top }) as DOMRect;
  }
}

describe('sectionInView', () => {
  beforeEach(() => vi.stubGlobal('innerHeight', 800));
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('is the section closest above the reading line (a quarter of the viewport)', () => {
    layout({ header: -1200, summary: -400, apps: 190, about: 1400 });
    expect(sectionInView(SECTIONS)).toBe('apps');
    layout({ header: -1200, summary: -400, apps: 210, about: 1400 });
    expect(sectionInView(SECTIONS)).toBe('summary');
  });

  it('at the end of the page, is the section scrolled to, not the cards below it', () => {
    layout({ header: -2489, summary: -2028, apps: 108, about: 252 });
    expect(sectionInView(SECTIONS)).toBe('apps');
  });

  it('is the first section at the top of the page', () => {
    layout({ header: 40, summary: 500, apps: 1200 });
    expect(sectionInView(SECTIONS)).toBe('header');
  });

  it("reads only the page's own sections, and is null without them", () => {
    layout({ header: -900, loop: 100 });
    expect(sectionInView(SECTIONS)).toBe('header');
    document.body.innerHTML = '';
    expect(sectionInView(SECTIONS)).toBeNull();
  });
});
