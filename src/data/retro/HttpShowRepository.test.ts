import type { ShowNarrateStreamEvent, ShowReplyStreamEvent } from './contract';
import { HttpShowRepository } from './HttpShowRepository';
import { RETRO_SCENARIO_ID } from './scenario';
import type { ShowReplyInput } from './ShowRepository';

const usage = {
  inputTokens: 1,
  outputTokens: 2,
  cacheReadInputTokens: 0,
  cacheCreationInputTokens: 0,
};
const done = `event: done\ndata: ${JSON.stringify({ stopReason: 'end_turn', usage })}\n\n`;
const line = (key: string, text: string) =>
  `event: line\ndata: ${JSON.stringify({ key, text })}\n\n`;

const input: ShowReplyInput = {
  step: 'layout',
  stepsDone: 1,
  messages: [{ role: 'user', content: 'wow, a marquee!' }],
};

function sse(body: string, init: ResponseInit = {}): Response {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream', 'X-Request-Id': 'req-1' },
    ...init,
  });
}

function repository(response: Response | Error) {
  const fetchFn = vi.fn<typeof fetch>(() =>
    response instanceof Response ? Promise.resolve(response) : Promise.reject(response),
  );
  return { repo: new HttpShowRepository(fetchFn), fetchFn };
}

async function collect<E>(stream: AsyncIterable<E>): Promise<E[]> {
  const events: E[] = [];
  for await (const event of stream) events.push(event);
  return events;
}

const narrate = (response: Response | Error, signal?: AbortSignal) => {
  const { repo, fetchFn } = repository(response);
  return { events: collect<ShowNarrateStreamEvent>(repo.narrate(signal)), fetchFn };
};
const reply = (response: Response | Error) => {
  const { repo, fetchFn } = repository(response);
  return { events: collect<ShowReplyStreamEvent>(repo.reply(input)), fetchFn };
};

const bodyOf = (fetchFn: ReturnType<typeof repository>['fetchFn']): unknown =>
  JSON.parse(String(fetchFn.mock.calls[0]?.[1]?.body));

describe('HttpShowRepository.narrate', () => {
  it('POSTs a v3 narrate request and yields lines then done', async () => {
    const { events, fetchFn } = narrate(
      sse(`${line('tokens', 'Fonts first.')}: ping\n\n${line('finale', 'Done.')}${done}`),
    );
    expect(await events).toEqual([
      { type: 'line', key: 'tokens', text: 'Fonts first.' },
      { type: 'line', key: 'finale', text: 'Done.' },
      { type: 'done', stopReason: 'end_turn', usage },
    ]);
    expect(fetchFn).toHaveBeenCalledWith('/api/chat', expect.objectContaining({ method: 'POST' }));
    expect(bodyOf(fetchFn)).toEqual({
      v: 3,
      locale: 'en',
      kind: 'narrate',
      scenario: RETRO_SCENARIO_ID,
    });
  });

  it('skips lines for unknown keys and unknown events', async () => {
    const { events } = narrate(
      sse(
        `${line('marquee', 'x')}event: delta\ndata: {"text":"x"}\n\n${line('links', 'L.')}${done}`,
      ),
    );
    expect(await events).toEqual([
      { type: 'line', key: 'links', text: 'L.' },
      { type: 'done', stopReason: 'end_turn', usage },
    ]);
  });

  it.each([
    ['a malformed line', 'event: line\ndata: {"key":"rest"}\n\n'],
    ['a done with an unknown stop reason', 'event: done\ndata: {"stopReason":"tool_use"}\n\n'],
    ['a stream without a terminal event', line('tokens', 'Fonts first.')],
  ])('turns %s into a retryable upstream_error', async (_, body) => {
    const events = await narrate(sse(body)).events;
    expect(events.at(-1)).toMatchObject({
      type: 'error',
      error: { code: 'upstream_error', retryable: true, requestId: 'req-1' },
    });
  });

  it('passes a mid-stream error event through after the lines so far', async () => {
    const error = { code: 'upstream_error', message: 'Deadline exceeded', retryable: true };
    const { events } = narrate(
      sse(`${line('tokens', 'Fonts first.')}event: error\ndata: ${JSON.stringify(error)}\n\n`),
    );
    expect(await events).toMatchObject([{ type: 'line' }, { type: 'error', error }]);
  });

  it('maps an error response (kill switch, old scenario) to its ChatError', async () => {
    const body = {
      error: { code: 'unavailable', message: 'Chat is switched off', retryable: true },
    };
    const events = await narrate(new Response(JSON.stringify(body), { status: 503 })).events;
    expect(events).toEqual([{ type: 'error', error: expect.objectContaining(body.error) }]);
  });

  it('maps a network failure to a retryable upstream_error, and ends quietly when aborted', async () => {
    expect(await narrate(new TypeError('offline')).events).toMatchObject([
      { type: 'error', error: { code: 'upstream_error', retryable: true } },
    ]);
    const controller = new AbortController();
    controller.abort();
    expect(
      await narrate(new DOMException('aborted', 'AbortError'), controller.signal).events,
    ).toEqual([]);
  });
});

describe('HttpShowRepository.reply', () => {
  it('POSTs a v3 reply request with the show state and yields deltas then done', async () => {
    const { events, fetchFn } = reply(
      sse(`event: delta\ndata: {"text":"Enjoy "}\n\nevent: delta\ndata: {"text":"it."}\n\n${done}`),
    );
    expect(await events).toEqual([
      { type: 'delta', text: 'Enjoy ' },
      { type: 'delta', text: 'it.' },
      { type: 'done', stopReason: 'end_turn', usage },
    ]);
    expect(bodyOf(fetchFn)).toEqual({
      v: 3,
      locale: 'en',
      kind: 'reply',
      scenario: RETRO_SCENARIO_ID,
      ...input,
    });
  });

  it('drops providerState and ignores tool_call events (v3 has no tools)', async () => {
    const call = { id: 'toolu_1', name: 'scrollToSection', input: { section: 'apps' } };
    const { events } = reply(
      sse(
        `event: tool_call\ndata: ${JSON.stringify(call)}\n\n` +
          `event: done\ndata: ${JSON.stringify({ stopReason: 'max_tokens', usage, providerState: 'x' })}\n\n`,
      ),
    );
    expect(await events).toEqual([{ type: 'done', stopReason: 'max_tokens', usage }]);
  });

  it('treats a tool_use stop as an upstream_error', async () => {
    const body = `event: done\ndata: ${JSON.stringify({ stopReason: 'tool_use', usage })}\n\n`;
    expect(await reply(sse(body)).events).toMatchObject([
      { type: 'error', error: { code: 'upstream_error' } },
    ]);
  });

  it('maps a platform 429 to rate_limited', async () => {
    const events = await reply(new Response('Too Many Requests', { status: 429 })).events;
    expect(events).toMatchObject([{ type: 'error', error: { code: 'rate_limited' } }]);
  });
});
