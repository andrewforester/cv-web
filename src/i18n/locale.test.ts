import { initialLocale } from './locale';

describe('locale', () => {
  it('is English whatever the browser language or an old stored choice', () => {
    localStorage.setItem('cv.locale', 'uk');
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('uk-UA');
    expect(initialLocale()).toBe('en');
  });
});
