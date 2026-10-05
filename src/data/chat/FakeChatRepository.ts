import type { ChatRepository } from './ChatRepository';
import type { ChatRequest, ChatRequestV2, ChatRequestV4, ChatStreamEventV2 } from './contract';

/**
 * Scripted `ChatRepository` for tests. Each `send` plays the next reply queued with `reply()`
 * (a reply without a terminal event ends like a truncated stream; `tool_call` events are not terminal). With nothing queued, the stream
 * stays open and waits for events pushed with `emit()` (and `end()`), so tests can step through a
 * streamed answer. Aborting the signal ends the stream. Every request is recorded in `requests`.
 */
export class FakeChatRepository implements ChatRepository {
  readonly requests: (ChatRequest | ChatRequestV2 | ChatRequestV4)[] = [];
  private readonly replies: ChatStreamEventV2[][] = [];
  private live: EventChannel | null = null;

  reply(...events: ChatStreamEventV2[]): this {
    this.replies.push(events);
    return this;
  }

  emit(...events: ChatStreamEventV2[]): void {
    if (!this.live) throw new Error('FakeChatRepository: no open stream to emit into');
    this.live.push(events);
  }

  end(): void {
    this.live?.close();
  }

  get isStreaming(): boolean {
    return this.live !== null;
  }

  async *send(
    request: ChatRequest | ChatRequestV2 | ChatRequestV4,
    signal?: AbortSignal,
  ): AsyncGenerator<ChatStreamEventV2> {
    this.requests.push(request);
    const channel = new EventChannel(signal);
    const scripted = this.replies.shift();
    if (scripted) {
      channel.push(scripted);
      channel.close();
    } else {
      this.live = channel;
    }
    try {
      for (;;) {
        const event = await channel.next();
        if (!event) return;
        yield event;
        if (event.type !== 'delta' && event.type !== 'tool_call') return;
      }
    } finally {
      if (this.live === channel) this.live = null;
    }
  }
}

/** A queue that a consumer awaits; `undefined` means closed or aborted. */
class EventChannel {
  private readonly queue: ChatStreamEventV2[] = [];
  private closed = false;
  private wake: (() => void) | null = null;

  constructor(private readonly signal?: AbortSignal) {
    signal?.addEventListener('abort', () => this.wake?.());
  }

  push(events: ChatStreamEventV2[]): void {
    this.queue.push(...events);
    this.wake?.();
  }

  close(): void {
    this.closed = true;
    this.wake?.();
  }

  async next(): Promise<ChatStreamEventV2 | undefined> {
    for (;;) {
      if (this.signal?.aborted) return undefined;
      const event = this.queue.shift();
      if (event) return event;
      if (this.closed) return undefined;
      await new Promise<void>((resolve) => (this.wake = resolve));
      this.wake = null;
    }
  }
}
