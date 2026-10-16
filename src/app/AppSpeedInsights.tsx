import { SpeedInsights } from '@vercel/speed-insights/react';
import { isSpeedInsightsHost, SPEED_INSIGHTS_ROUTE } from './speedInsights';

/** Real-user Core Web Vitals for Vercel Speed Insights; renders nothing visible. */
export function AppSpeedInsights() {
  if (!isSpeedInsightsHost(import.meta.env.PROD, window.location.hostname)) return null;
  return <SpeedInsights route={SPEED_INSIGHTS_ROUTE} />;
}
