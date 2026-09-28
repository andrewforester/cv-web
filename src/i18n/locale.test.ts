import { initialLocale, matchLocale } from './locale';

describe('locale', () => {
  it('maps browser tags to supported locales', () => {
    expect(matchLocale('uk-UA')).toBe('uk');
    expect(matchLocale('en-GB')).toBe('en');
    expect(matchLocale('de-DE')).toBeUndefined();
  });

  it('prefers the stored choice over the browser language', () => {
    localStorage.setItem('cv.locale', 'uk');
    expect(initialLocale()).toBe('uk');
  });
});
