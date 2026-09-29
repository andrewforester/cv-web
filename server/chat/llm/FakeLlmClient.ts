import type {
  AgentToolCall,
  ChatStopReasonV2,
  ChatUsage,
} from '../../../src/data/chat/contract.js';
import {
  LlmError,
  type LlmAssistantBlock,
  type LlmClient,
  type LlmEvent,
  type LlmRequest,
  type LlmStream,
} from './LlmClient.js';

/** What the fake model does for one request. */
export interface FakeScript {
  deltas: string[];
  /** `tool_use` blocks after the text; `stopReason` then defaults to `tool_use`. */
  toolCalls?: AgentToolCall[];
  /** A thinking block before the text (Sonnet 5.5's progress note), echoed in `blocks`. */
  thinking?: string;
  stopReason?: ChatStopReasonV2;
  usage?: ChatUsage;
  /** Fail before the stream starts (the handler answers `502`). */
  failBeforeStart?: LlmError;
  /** Fail after this many deltas (the handler sends an `error` event). */
  failAfterDeltas?: { count: number; error: LlmError };
  /** Pause before each delta, e.g. to watch streaming in dev. */
  delayMs?: number;
  /** After the deltas, wait until aborted instead of finishing. */
  hang?: boolean;
}

const FAKE_USAGE: ChatUsage = {
  inputTokens: 100,
  outputTokens: 20,
  cacheReadInputTokens: 0,
  cacheCreationInputTokens: 0,
};

function abortError(): Error {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/** The assistant turn a real model would have produced for `script`. */
function fakeBlocks(script: FakeScript): LlmAssistantBlock[] {
  const text = script.deltas.join('');
  return [
    ...(script.thinking !== undefined
      ? [{ type: 'thinking', thinking: script.thinking, signature: 'fake-signature' } as const]
      : []),
    ...(text !== '' ? [{ type: 'text', text } as const] : []),
    ...(script.toolCalls ?? []).map(({ id, name, input }): LlmAssistantBlock => ({
      type: 'tool_use',
      id,
      name,
      input,
    })),
  ];
}

/** Scripted model for tests and `CHAT_FAKE_LLM=1` dev mode; records what it was asked. */
export class FakeLlmClient implements LlmClient {
  readonly requests: LlmRequest[] = [];
  readonly signals: AbortSignal[] = [];

  constructor(private readonly script: FakeScript | ((request: LlmRequest) => FakeScript)) {}

  async start(request: LlmRequest, signal: AbortSignal): Promise<LlmStream> {
    this.requests.push(request);
    this.signals.push(signal);
    const script = typeof this.script === 'function' ? this.script(request) : this.script;
    if (script.failBeforeStart) throw script.failBeforeStart;
    return { events: this.events(script, signal), providerRequestId: 'fake_request' };
  }

  private async *events(script: FakeScript, signal: AbortSignal): AsyncGenerator<LlmEvent> {
    for (const [index, text] of script.deltas.entries()) {
      if (script.failAfterDeltas?.count === index) throw script.failAfterDeltas.error;
      await sleep(script.delayMs ?? 0, signal);
      yield { type: 'text', text };
    }
    if (script.failAfterDeltas?.count === script.deltas.length) throw script.failAfterDeltas.error;
    if (script.hang) await sleep(2 ** 31 - 1, signal);
    const calls = script.toolCalls ?? [];
    for (const call of calls) yield { type: 'tool_call', call };
    const stopReason = script.stopReason ?? (calls.length > 0 ? 'tool_use' : 'end_turn');
    yield {
      type: 'done',
      stopReason,
      usage: script.usage ?? FAKE_USAGE,
      ...(stopReason === 'tool_use' ? { blocks: fakeBlocks(script) } : {}),
    };
  }
}
