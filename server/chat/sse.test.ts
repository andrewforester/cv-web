import { describe, expect, it } from 'vitest';
import { encodeSseEvent, SSE_HEADERS, SSE_PING } from './sse.js';

describe('sse', () => {
  it('frames an event as event line, one data line and a blank line', () => {
    expect(encodeSseEvent('delta', { text: 'Андрій\nline "two"' })).toBe(
      'event: delta\ndata: {"text":"Андрій\\nline \\"two\\""}\n\n',
    );
    expect(
      encodeSseEvent('done', {
        stopReason: 'end_turn',
        usage: {
          inputTokens: 1,
          outputTokens: 2,
          cacheReadInputTokens: 3,
          cacheCreationInputTokens: 4,
        },
      }),
    ).toBe(
      'event: done\ndata: {"stopReason":"end_turn","usage":{"inputTokens":1,"outputTokens":2,"cacheReadInputTokens":3,"cacheCreationInputTokens":4}}\n\n',
    );
    expect(encodeSseEvent('error', { code: 'upstream_error', message: 'x', retryable: true })).toBe(
      'event: error\ndata: {"code":"upstream_error","message":"x","retryable":true}\n\n',
    );
  });

  it('pings with a comment and sends streaming headers', () => {
    expect(SSE_PING).toBe(': ping\n\n');
    expect(SSE_HEADERS).toEqual({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    });
  });
});
