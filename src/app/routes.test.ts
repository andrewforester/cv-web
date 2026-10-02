import { pageFor } from './routes';

describe('pageFor', () => {
  it('maps /new to the profile and everything else to the CV', () => {
    expect(pageFor('/new')).toBe('profile');
    expect(pageFor('/new/')).toBe('profile');
    expect(pageFor('/')).toBe('cv');
    expect(pageFor('')).toBe('cv');
    expect(pageFor('/news')).toBe('cv');
    expect(pageFor('/new/x')).toBe('cv');
  });
});
