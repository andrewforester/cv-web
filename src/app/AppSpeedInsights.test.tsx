import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppSpeedInsights, isSpeedInsightsHost, SPEED_INSIGHTS_ROUTE } from './AppSpeedInsights';

const speedInsights = vi.hoisted(() => vi.fn(() => null));
vi.mock('@vercel/speed-insights/react', () => ({ SpeedInsights: speedInsights }));

describe('AppSpeedInsights', () => {
  it('runs only in a production build on a non-local host', () => {
    expect(isSpeedInsightsHost(true, 'cv-web-inky-five.vercel.app')).toBe(true);
    expect(isSpeedInsightsHost(true, 'localhost')).toBe(false);
    expect(isSpeedInsightsHost(false, 'cv-web-inky-five.vercel.app')).toBe(false);
  });

  it('is off in tests (not a production build) and attributes views to /', () => {
    render(<AppSpeedInsights />);
    expect(speedInsights).not.toHaveBeenCalled();
    expect(SPEED_INSIGHTS_ROUTE).toBe('/');
  });
});
