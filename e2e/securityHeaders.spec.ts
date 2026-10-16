import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { SECURITY_HEADERS } from '../scripts/securityHeaders';
import { collectErrors, NORMAL_SITE } from './support';

const VOICE_ORIGINS = [
  'https://api.elevenlabs.io',
  'wss://api.elevenlabs.io',
  'https://livekit.rtc.elevenlabs.io',
  'wss://livekit.rtc.elevenlabs.io',
];

function directive(policy: string, name: string): string[] {
  const found = policy
    .split(';')
    .map((part) => part.trim().split(/\s+/))
    .find(([key]) => key === name);
  return found?.slice(1) ?? [];
}

test('vercel.json sends the same security headers as vite preview', () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
    headers: { source: string; headers: { key: string; value: string }[] }[];
  };
  expect(config.headers).toHaveLength(1);
  expect(config.headers[0]?.source).toBe('/(.*)');
  const sent = Object.fromEntries(config.headers[0]?.headers.map((h) => [h.key, h.value]) ?? []);
  expect(sent).toEqual(SECURITY_HEADERS);
});

test('vercel.json gives the voice session function room for the agent sync', () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
    functions: Record<string, { maxDuration?: number }>;
  };
  expect(config.functions['api/voice-session.ts']?.maxDuration).toBe(30);
});

test('the policy lets the voice agent connect and use the mic, and nothing more', () => {
  const csp = SECURITY_HEADERS['Content-Security-Policy'] ?? '';
  expect(directive(csp, 'connect-src').sort()).toEqual(["'self'", ...VOICE_ORIGINS].sort());
  // Worklets are self-hosted: no blob:, data: or CDN scripts for the voice SDK.
  expect(directive(csp, 'script-src')).toEqual(["'self'"]);
  expect(SECURITY_HEADERS['Permissions-Policy']).toBe(
    'camera=(), microphone=(self), geolocation=(), payment=()',
  );
});

test('the browser allows the microphone on the page and still blocks the camera', async ({
  page,
}) => {
  test.skip(!!process.env.PW_BASE_URL, 'local preview only');
  await page.goto(NORMAL_SITE);
  const allowed = await page.evaluate(() => {
    const policy = (
      document as Document & { featurePolicy?: { allowsFeature(name: string): boolean } }
    ).featurePolicy;
    return policy
      ? { microphone: policy.allowsFeature('microphone'), camera: policy.allowsFeature('camera') }
      : null;
  });
  expect(allowed).toEqual({ microphone: true, camera: false });
});

test('the page is served with the enforcing CSP', async ({ request }) => {
  test.skip(!!process.env.PW_BASE_URL, 'production gets its headers from Vercel');
  const response = await request.get('./');
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    expect(response.headers()[name.toLowerCase()]).toBe(value);
  }
});

test('a CSP violation fails the web check', async ({ page }) => {
  test.skip(!!process.env.PW_BASE_URL, 'local preview only');
  const errors = collectErrors(page);
  await page.goto('./?retro=0');
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.textContent = 'window.__inline = 1';
    document.body.append(script);
  });
  await expect.poll(() => errors.some((e) => e.includes('Content Security Policy'))).toBe(true);
});
