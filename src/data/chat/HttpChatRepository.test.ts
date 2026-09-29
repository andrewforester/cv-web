import type { ChatRequest, ChatStreamEvent } from './contract';
import { HttpChatRepository } from './HttpChatRepository';

const request: ChatRequest = { v: 1, locale: 'en', messages: [{ role: 'user', content: 'Hi' }] };
const usage = { inputTokens: 1, outputTokens: 2, cacheReadInputTokens: 0, cacheCreationInputTokens: 0 };

function sse(body: string, init: ResponseInit = {}): Response {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream', 'X-Request-Id': 'req-1' },
    ...init,
  });
}

async function collect(response: Response | Error, signal?: AbortSignal) {
  const fetchFn = vi.fn<typeof fetch>(() =>
    response instanceof Response ? Promise.resolve(response) : Promise.reject(response),
  );
  const events: ChatStreamEvent[] = [];
  for await (const event of new HttpChatRepository(fetchFn).send(request, signal)) {
    events.push(event);
  }
  return { events, fetchFn };
}

describe('HttpChatRepository', () => {
  it('POSTs the request as JSON and yields deltas then done', async () => {
    const { events, fetchFn } = await collect(
      sse(
        'event: delta\ndata: {"text":"Hel"}\n\n: ping\n\nevent: delta\ndata: {"text":"lo"}\n\n' +
          `event: done\ndata: ${JSON.stringify({ stopReason: 'end_turn', usage })}\n\n`,
      ),
    );
    expect(fetchFn).toHaveBeenCalledWith('/api/chat', expect.objectContaining({ method: 'POST' }));
    const init = fetchFn.mock.calls[0]?.[1];
    expect(JSON.parse(String(init?.body))).toEqual(request);
    expect(events).toEqual([
      { type: 'delta', text: 'Hel' },
      { type: 'delta', text: 'lo' },
      { type: 'done', stopReason: 'end_turn', usage },
    ]);
  });

  it('passes a mid-stream error event through', async () => {
    const { events } = await collect(
      sse(
        'event: delta\ndata: {"text":"a"}\n\nevent: error\ndata: {"code":"upstream_error","message":"x","retryable":true}\n\n',
      ),
    );
    expect(events[1]).toEqual({
      type: 'error',
      error: expect.objectContaining({ code: 'upstream_error', retryable: true }),
    });
  });

  it('maps a stream without a terminal event to a retryable upstream_error', async () => {
    const { events } = await collect(sse('event: delta\ndata: {"text":"a"}\n\n'));
    expect(events.at(-1)).toEqual({
      type: 'error',
      error: expect.objectContaining({ code: 'upstream_error', retryable: true, requestId: 'req-1' }),
    });
  });

  it('maps a JSON error body', async () => {
    const body = { error: { code: 'too_long', message: 'too long', retryable: false } };
    const { events } = await collect(new Response(JSON.stringify(body), { status: 413 }));
    expect(events).toEqual([{ type: 'error', error: expect.objectContaining(body.error) }]);
  });

  it('maps a non-JSON 429 to rate_limited with Retry-After or 60 s', async () => {
    const withHeader = await collect(
      new Response('Too Many Requests', { status: 429, headers: { 'Retry-After': '42' } }),
    );
    expect(withHeader.events[0]).toEqual({
      type: 'error',
      error: expect.objectContaining({ code: 'rate_limited', retryable: true, retryAfterSeconds: 42 }),
    });
    const withoutHeader = await collect(new Response('<html>', { status: 429 }));
    expect(withoutHeader.events[0]).toEqual({
      type: 'error',
      error: expect.objectContaining({ code: 'rate_limited', retryAfterSeconds: 60 }),
    });
  });

  it('maps unparsable 5xx to retryable and 4xx to non-retryable upstream_error', async () => {
    const server = await collect(new Response('FUNCTION_INVOCATION_TIMEOUT', { status: 504 }));
    expect(server.events[0]).toEqual({
      type: 'error',
      error: expect.objectContaining({ code: 'upstream_error', retryable: true }),
    });
    const client = await collect(new Response('nope', { status: 404 }));
    expect(client.events[0]).toEqual({
      type: 'error',
      error: expect.objectContaining({ code: 'upstream_error', retryable: false }),
    });
  });

  it('treats unknown error codes as not retryable', async () => {
    const body = { error: { code: 'brand_new', message: 'x', retryable: true } };
    const { events } = await collect(new Response(JSON.stringify(body), { status: 400 }));
    expect(events[0]).toEqual({
      type: 'error',
      error: expect.objectContaining({ code: 'brand_new', retryable: false }),
    });
  });

  it('maps a network failure to upstream_error, and ends silently when aborted', async () => {
    const failed = await collect(new TypeError('Failed to fetch'));
    expect(failed.events[0]).toEqual({
      type: 'error',
      error: expect.objectContaining({ code: 'upstream_error', retryable: true }),
    });
    const controller = new AbortController();
    controller.abort();
    const aborted = await collect(new DOMException('aborted', 'AbortError'), controller.signal);
    expect(aborted.events).toEqual([]);
  });
});
