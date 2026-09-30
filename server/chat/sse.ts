import type { ChatSsePayloadsV2 } from '../../src/data/chat/contract.js';
import type { ShowSsePayloads } from '../../src/data/retro/contract.js';

/** Every event the function streams: v2's (v1 uses a subset) and the show's `line` (v3). */
type SsePayloads = ChatSsePayloadsV2 & Pick<ShowSsePayloads, 'line'>;

/** One SSE event: `event:` line, one `data:` line of JSON, blank line. */
export function encodeSseEvent<N extends keyof SsePayloads>(
  name: N,
  payload: SsePayloads[N],
): string {
  return `event: ${name}\ndata: ${JSON.stringify(payload)}\n\n`;
}

/** Keep-alive comment; clients ignore lines starting with `:`. */
export const SSE_PING = ': ping\n\n';

export const SSE_HEADERS: Record<string, string> = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  'X-Accel-Buffering': 'no',
};
