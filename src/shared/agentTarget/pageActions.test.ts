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

function scrollTo(scrollY: number, scrollHeight: number) {
  vi.stubGlobal('scrollY', scrollY);
  vi.stubGlobal('innerHeight', 900);
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: scrollHeight,
    configurable: true,
  });
}

describe('sectionInView', () => {
  beforeEach(() => scrollTo(0, 5000));
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('is the section closest above the reading line (a third of the viewport)', () => {
    layout({ header: -1200, summary: -400, apps: 250, about: 1400 });
    expect(sectionInView(SECTIONS)).toBe('apps');
    layout({ header: -1200, summary: -400, apps: 320, about: 1400 });
    expect(sectionInView(SECTIONS)).toBe('summary');
  });

  it('is the first section at the top of the page', () => {
    layout({ header: 40, summary: 500, apps: 1200 });
    expect(sectionInView(SECTIONS)).toBe('header');
  });

  it('is the last section on screen at the end of the page', () => {
    scrollTo(4100, 5000);
    layout({ header: -4000, apps: -300, about: 600 });
    expect(sectionInView(SECTIONS)).toBe('about');
  });

  it("reads only the page's own sections, and is null without them", () => {
    layout({ header: -900, loop: 100 });
    expect(sectionInView(SECTIONS)).toBe('header');
    document.body.innerHTML = '';
    expect(sectionInView(SECTIONS)).toBeNull();
  });
});
