import type { ChatSseEventNameV2, ChatSsePayloadsV2 } from '../../src/data/chat/contract.js';

/** One SSE event: `event:` line, one `data:` line of JSON, blank line. v1 uses a subset. */
export function encodeSseEvent<N extends ChatSseEventNameV2>(
  name: N,
  payload: ChatSsePayloadsV2[N],
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
