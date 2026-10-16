import { activeNavSection, HOME_NAV_SECTIONS } from './homeNav';

/** Puts every `section:<id>` element on the page at the given viewport tops (header included). */
function layout(tops: Record<string, number>) {
  document.body.innerHTML = Object.keys(tops)
    .map((id) => `<section data-agent-id="section:${id}"></section>`)
    .join('');
  for (const [id, top] of Object.entries(tops)) {
    const element = document.querySelector(`[data-agent-id="section:${id}"]`);
    if (element) element.getBoundingClientRect = () => ({ top }) as DOMRect;
  }
}

/** Every nav section below the fold, except the ones given. */
const below = (tops: Record<string, number> = {}) => ({
  ...Object.fromEntries(HOME_NAV_SECTIONS.map((id) => [id, 3000])),
  ...tops,
});

describe('activeNavSection', () => {
  beforeEach(() => {
    vi.stubGlobal('innerHeight', 800);
    vi.stubGlobal('scrollY', 0);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('is none while the visitor reads the header', () => {
    layout({ header: 0, ...below() });
    expect(activeNavSection()).toBeNull();
  });

  it('is the section crossing the reading line', () => {
    layout({ header: -2000, ...below({ skills: -900, impact: -300, projects: 150 }) });
    expect(activeNavSection()).toBe('projects');
  });

  it('is the last section once the page is scrolled to its end', () => {
    layout({ header: -5000, ...below({ about: -200, contacts: 500 }) });
    vi.stubGlobal('scrollY', 4200);
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(5000);
    expect(activeNavSection()).toBe('contacts');
  });

  it('lists the page sections in page order, header excluded', () => {
    expect(HOME_NAV_SECTIONS).toEqual([
      'skills',
      'impact',
      'projects',
      'experience',
      'craft',
      'loop',
      'education',
      'about',
      'contacts',
    ]);
  });
});
