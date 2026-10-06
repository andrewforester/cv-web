import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { SECURITY_HEADERS } from '../scripts/securityHeaders';
import { collectErrors } from './support';

test('vercel.json sends the same security headers as vite preview', () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
    headers: { source: string; headers: { key: string; value: string }[] }[];
  };
  expect(config.headers).toHaveLength(1);
  expect(config.headers[0]?.source).toBe('/(.*)');
  const sent = Object.fromEntries(config.headers[0]?.headers.map((h) => [h.key, h.value]) ?? []);
  expect(sent).toEqual(SECURITY_HEADERS);
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
