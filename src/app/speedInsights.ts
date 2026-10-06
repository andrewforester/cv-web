/** The deployed site's route for every page view: one page, so `?retro=1` and any path count as `/`. */
export const SPEED_INSIGHTS_ROUTE = '/';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/** Speed Insights exists only behind Vercel (`/_vercel/speed-insights/*`); not in dev or local preview. */
export function isSpeedInsightsHost(production: boolean, hostname: string): boolean {
  return production && !LOCAL_HOSTS.has(hostname);
}
