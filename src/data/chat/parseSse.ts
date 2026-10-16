/** One Server-Sent Event: its name (`message` when unnamed) and its `data` lines joined by `\n`. */
export interface SseEvent {
  event: string;
  data: string;
}

const LINE_BREAK = /\r\n|\r|\n/;

/**
 * Incremental SSE parser (WHATWG framing) over a byte stream: UTF-8 split across chunks, CRLF / CR /
 * LF line ends (also split across chunks), `:` comments, multi-line `data`, `id` / `retry` ignored.
 * An event is dispatched on a blank line; an unterminated last event is dropped, as the spec says.
 * Stopping the iteration early cancels the underlying stream.
 */
export async function* parseSse(body: ReadableStream<Uint8Array>): AsyncGenerator<SseEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let event = '';
  let data: string[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      // A trailing CR may be the first half of a CRLF split across chunks: keep it for later.
      const holdCr = !done && buffer.endsWith('\r');
      const lines = (holdCr ? buffer.slice(0, -1) : buffer).split(LINE_BREAK);
      buffer = (lines.pop() ?? '') + (holdCr ? '\r' : '');

      for (const line of lines) {
        if (line === '') {
          if (data.length > 0) yield { event: event || 'message', data: data.join('\n') };
          event = '';
          data = [];
          continue;
        }
        if (line.startsWith(':')) continue;
        const colon = line.indexOf(':');
        const field = colon === -1 ? line : line.slice(0, colon);
        const raw = colon === -1 ? '' : line.slice(colon + 1);
        const fieldValue = raw.startsWith(' ') ? raw.slice(1) : raw;
        if (field === 'event') event = fieldValue;
        else if (field === 'data') data.push(fieldValue);
      }
      if (done) return;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}
