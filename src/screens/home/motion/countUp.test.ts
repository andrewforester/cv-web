import { countText, easeOutExpo } from './countUp';
import cvPage from '../../../data/cv/cvPage.json';

describe('countText', () => {
  it('starts every numeric stat from 0 and ends on the exact data text', () => {
    expect(countText('12+', 0)).toBe('0+');
    expect(countText('1M+', 0)).toBe('0K+');
    expect(countText('2', 0)).toBe('0');
    cvPage.stats.forEach(({ value }) => {
      const end = countText(value, 1);
      if (end !== null) expect(end).toBe(value);
    });
  });

  it('counts millions in thousands, then lands on the value', () => {
    expect(countText('1M+', 0.5)).toBe('500K+');
    expect(countText('1M+', 0.999)).toBe('999K+');
    expect(countText('1M+', 1)).toBe('1M+');
    expect(countText('12+', 0.5)).toBe('6+');
  });

  it('does not count non-numeric values (no scramble: `AI` stays as it is)', () => {
    expect(countText('AI', 0)).toBeNull();
  });
});

describe('easeOutExpo', () => {
  it('runs from 0 to exactly 1, fast first', () => {
    expect(easeOutExpo(0)).toBe(0);
    expect(easeOutExpo(0.5)).toBeGreaterThan(0.9);
    expect(easeOutExpo(1)).toBe(1);
  });
});
