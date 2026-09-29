import { parseSse, type SseEvent } from './parseSse';

function streamOf(chunks: (string | Uint8Array)[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(typeof chunk === 'string' ? encoder.encode(chunk) : chunk);
      }
      controller.close();
    },
  });
}

async function collect(chunks: (string | Uint8Array)[]): Promise<SseEvent[]> {
  const events: SseEvent[] = [];
  for await (const event of parseSse(streamOf(chunks))) events.push(event);
  return events;
}

describe('parseSse', () => {
  it('parses named events, ignores comments and unknown fields', async () => {
    const events = await collect([
      ': ping\n\n',
      'event: delta\ndata: {"text":"Hi"}\nid: 7\n\n',
      'event: done\ndata: {}\n\n',
    ]);
    expect(events).toEqual([
      { event: 'delta', data: '{"text":"Hi"}' },
      { event: 'done', data: '{}' },
    ]);
  });

  it('handles events and CRLF line ends split across chunks', async () => {
    const events = await collect(['event: del', 'ta\r', '\ndata: {"text":', '"a"}\r\n', '\r\n']);
    expect(events).toEqual([{ event: 'delta', data: '{"text":"a"}' }]);
  });

  it('decodes multi-byte UTF-8 split across chunks', async () => {
    const bytes = new TextEncoder().encode('data: Привіт\n\n');
    const events = await collect([bytes.slice(0, 8), bytes.slice(8)]);
    expect(events).toEqual([{ event: 'message', data: 'Привіт' }]);
  });

  it('joins multi-line data and drops an unterminated last event', async () => {
    const events = await collect(['data: a\ndata: b\n\n', 'event: delta\ndata: cut']);
    expect(events).toEqual([{ event: 'message', data: 'a\nb' }]);
  });
});
