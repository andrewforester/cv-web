import type { ChatSseEventName, ChatSsePayloads } from '../../src/data/chat/contract.js';

/** One SSE event: `event:` line, one `data:` line of JSON, blank line. */
export function encodeSseEvent<N extends ChatSseEventName>(
  name: N,
  payload: ChatSsePayloads[N],
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
