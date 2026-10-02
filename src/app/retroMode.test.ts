import { decideRetroMode } from './retroMode';

describe('decideRetroMode', () => {
  it('opens the show only with ?retro=1', () => {
    expect(decideRetroMode('?retro=1')).toBe('show');
    expect(decideRetroMode('?lang=en&retro=1')).toBe('show');
  });

  it('gives today’s site otherwise: no auto-start, ?retro=0 is the default', () => {
    expect(decideRetroMode('')).toBe('normal');
    expect(decideRetroMode('?retro=0')).toBe('normal');
    expect(decideRetroMode('?retro=yes')).toBe('normal');
  });
});
