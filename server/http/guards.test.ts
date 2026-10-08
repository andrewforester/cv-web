import { describe, expect, it } from 'vitest';
import { chatRequest } from '../test/helpers.js';
import { clientIp } from './clientIp.js';
import { checkContentType, checkMethod, checkOrigin, readBody } from './guards.js';

describe('guards', () => {
  it('allows POST only', () => {
    expect(checkMethod(chatRequest())).toBeUndefined();
    expect(checkMethod(chatRequest(undefined, { method: 'GET' }))?.code).toBe('method_not_allowed');
  });

  it('requires an Origin whose host equals the request host', () => {
    expect(checkOrigin(chatRequest())).toBeUndefined();
    const withOrigin = (origin: string, extra: Record<string, string> = {}) =>
      checkOrigin(chatRequest(undefined, { headers: { origin, ...extra } }))?.code;
    expect(withOrigin('https://evil.example.com')).toBe('forbidden_origin');
    expect(withOrigin('https://cv.example.com:8443')).toBe('forbidden_origin');
    expect(withOrigin('not a url')).toBe('forbidden_origin');
    expect(withOrigin('null')).toBe('forbidden_origin');
    // X-Forwarded-Host (Vercel) wins over Host.
    expect(
      withOrigin('https://cv-web.vercel.app', { 'x-forwarded-host': 'cv-web.vercel.app' }),
    ).toBeUndefined();
  });

  it('rejects a missing Origin', () => {
    const request = new Request('https://cv.example.com/api/chat', {
      method: 'POST',
      headers: { host: 'cv.example.com', 'content-type': 'application/json' },
      body: '{}',
    });
    expect(checkOrigin(request)?.code).toBe('forbidden_origin');
  });

  it('requires a JSON content type', () => {
    expect(checkContentType(chatRequest())).toBeUndefined();
    const typed = (type: string) =>
      checkContentType(chatRequest(undefined, { headers: { 'content-type': type } }))?.code;
    expect(typed('application/json; charset=utf-8')).toBeUndefined();
    expect(typed('text/plain')).toBe('unsupported_media_type');
    expect(typed('application/x-www-form-urlencoded')).toBe('unsupported_media_type');
  });

  it('reads the body up to the byte cap', async () => {
    await expect(readBody(chatRequest('{"a":"ї"}'), 10)).resolves.toEqual({
      ok: true,
      text: '{"a":"ї"}',
    });
    const over = await readBody(chatRequest('{"a":"ї"}'), 9);
    expect(over).toMatchObject({ ok: false, error: { code: 'too_long' } });
  });

  it('rejects a declared Content-Length above the cap before reading', async () => {
    const request = chatRequest('{}', { headers: { 'content-length': '999999' } });
    await expect(readBody(request, 100)).resolves.toMatchObject({ ok: false });
  });
});

describe('clientIp', () => {
  const ip = (headers: Record<string, string>) =>
    clientIp(new Request('https://x.test', { headers }));

  it('prefers x-real-ip, then the first x-forwarded-for entry', () => {
    expect(ip({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' })).toBe('1.1.1.1');
    expect(ip({ 'x-forwarded-for': '2.2.2.2, 3.3.3.3' })).toBe('2.2.2.2');
    expect(ip({})).toBe('unknown');
  });
});
