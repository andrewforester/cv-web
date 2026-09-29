import { describe, expect, it } from 'vitest';
import { DayCostMeter } from './dayCost.js';

describe('DayCostMeter', () => {
  it('sums the UTC day and starts again at midnight', () => {
    let now = Date.UTC(2026, 8, 30, 23, 59, 0);
    const meter = new DayCostMeter(() => now);
    meter.add(0.0012);
    meter.add(0.0021);
    expect(meter.totalToday()).toBe(0.0033);
    expect(meter.secondsToNextDay()).toBe(60);
    now = Date.UTC(2026, 9, 1, 0, 0, 1);
    expect(meter.totalToday()).toBe(0);
    meter.add(0.5);
    expect(meter.totalToday()).toBe(0.5);
  });
});
