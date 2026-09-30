import { decideRetroMode, markRetroDone, readRetroMode, RETRO_DONE_KEY } from './retroMode';

const visitor = { search: '', locale: 'en', desktop: true, done: false } as const;

describe('decideRetroMode', () => {
  it('shows the show to an English desktop visitor once per session', () => {
    expect(decideRetroMode(visitor)).toBe('show');
    expect(decideRetroMode({ ...visitor, done: true })).toBe('normal');
  });

  it('gives Ukrainian and mobile visitors the normal site', () => {
    expect(decideRetroMode({ ...visitor, locale: 'uk' })).toBe('normal');
    expect(decideRetroMode({ ...visitor, desktop: false })).toBe('normal');
  });

  it('lets ?retro=1 force the show and ?retro=0 skip it', () => {
    const everythingAgainst = { locale: 'uk', desktop: false, done: true } as const;
    expect(decideRetroMode({ ...everythingAgainst, search: '?retro=1' })).toBe('show');
    expect(decideRetroMode({ ...visitor, search: '?lang=en&retro=0' })).toBe('normal');
    expect(decideRetroMode({ ...visitor, search: '?retro=yes' })).toBe('show');
  });
});

describe('readRetroMode', () => {
  afterEach(() => sessionStorage.clear());

  it('is normal without matchMedia (jsdom), so app tests run the normal site', () => {
    expect(readRetroMode('en')).toBe('normal');
  });

  it('remembers a finished show for the session', () => {
    markRetroDone();
    expect(sessionStorage.getItem(RETRO_DONE_KEY)).toBe('1');
  });
});
