import { HttpVoiceSessionRepository } from './HttpVoiceSessionRepository';

const session = { v: 1, conversationToken: 'tok_123', maxCallSeconds: 180 };

function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'X-Request-Id': 'req-1' },
    ...init,
  });
}

async function create(response: Response | Error, signal?: AbortSignal) {
  const fetchFn = vi.fn<typeof fetch>(() =>
    response instanceof Response ? Promise.resolve(response) : Promise.reject(response),
  );
  const result = await new HttpVoiceSessionRepository(fetchFn).create(signal);
  return { result, fetchFn };
}

describe('HttpVoiceSessionRepository', () => {
  it('POSTs { v: 1 } as JSON and returns the session', async () => {
    const { result, fetchFn } = await create(json(session));
    expect(fetchFn).toHaveBeenCalledWith(
      '/api/voice-session',
      expect.objectContaining({ method: 'POST' }),
    );
    const init = fetchFn.mock.calls[0]?.[1];
    expect(JSON.parse(String(init?.body))).toEqual({ v: 1 });
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');
    expect(result).toEqual({ ok: true, session });
  });

  it('treats a malformed success body as a retryable upstream_error', async () => {
    for (const body of [{ v: 2, conversationToken: 't', maxCallSeconds: 180 }, { v: 1 }, 'x']) {
      const { result } = await create(json(body));
      expect(result).toEqual({
        ok: false,
        error: expect.objectContaining({
          code: 'upstream_error',
          retryable: true,
          requestId: 'req-1',
        }),
      });
    }
  });

  it('passes a JSON error body through: quota_exhausted keeps its retry time', async () => {
    const error = {
      code: 'quota_exhausted',
      message: 'Month used up',
      retryable: false,
      retryAfterSeconds: 86_400,
      requestId: 'req-2',
    };
    const { result } = await create(json({ error }, { status: 503 }));
    expect(result).toEqual({ ok: false, error });
  });

  it('gives a JSON rate_limited without a retry time the Retry-After header', async () => {
    const body = { error: { code: 'rate_limited', message: 'slow down', retryable: true } };
    const { result } = await create(json(body, { status: 429, headers: { 'Retry-After': '30' } }));
    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'rate_limited', retryAfterSeconds: 30 }),
    });
  });

  it('maps a platform 429 without a body to rate_limited (Retry-After or 60 s)', async () => {
    const withHeader = await create(
      new Response('Too Many Requests', { status: 429, headers: { 'Retry-After': '42' } }),
    );
    expect(withHeader.result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'rate_limited', retryAfterSeconds: 42 }),
    });
    const withoutHeader = await create(new Response('<html>', { status: 429 }));
    expect(withoutHeader.result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'rate_limited', retryAfterSeconds: 60 }),
    });
  });

  it('maps unparsable 5xx to retryable and 4xx to non-retryable upstream_error', async () => {
    const server = await create(new Response('FUNCTION_INVOCATION_TIMEOUT', { status: 504 }));
    expect(server.result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'upstream_error', retryable: true }),
    });
    const client = await create(new Response('nope', { status: 404 }));
    expect(client.result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'upstream_error', retryable: false }),
    });
  });

  it('treats unknown error codes as not retryable', async () => {
    const body = { error: { code: 'brand_new', message: 'x', retryable: true } };
    const { result } = await create(json(body, { status: 400 }));
    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'brand_new', retryable: false }),
    });
  });

  it('maps a network failure to a retryable upstream_error, an abort to a final one', async () => {
    const failed = await create(new TypeError('Failed to fetch'));
    expect(failed.result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'upstream_error', retryable: true }),
    });
    const controller = new AbortController();
    controller.abort();
    const aborted = await create(new DOMException('aborted', 'AbortError'), controller.signal);
    expect(aborted.result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'upstream_error', retryable: false }),
    });
  });
});
