import type { ChatStopReason, ChatUsage } from '../../../src/data/chat/contract.js';
import {
  LlmError,
  type LlmClient,
  type LlmEvent,
  type LlmRequest,
  type LlmStream,
} from './LlmClient.js';

/** What the fake model does for one request. */
export interface FakeScript {
  deltas: string[];
  stopReason?: ChatStopReason;
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
    yield {
      type: 'done',
      stopReason: script.stopReason ?? 'end_turn',
      usage: script.usage ?? FAKE_USAGE,
    };
  }
}

const DEV_ANSWERS = {
  en: 'This is a scripted answer from the fake model (CHAT_FAKE_LLM=1). Andrew is a **Senior Android Engineer** with iOS experience.\n\n- Kotlin, Jetpack Compose\n- Cync and August Home apps',
  uk: 'Це заготовлена відповідь фейкової моделі (CHAT_FAKE_LLM=1). Андрій — **Senior Android Engineer** з досвідом iOS.\n\n- Kotlin, Jetpack Compose\n- застосунки Cync і August Home',
};

/** Splits text into word-sized deltas, like a real stream. */
function words(text: string): string[] {
  return text.match(/\S+\s*/g) ?? [];
}

/**
 * Dev-mode script. The last visitor message may start with a command to exercise the widget:
 * `/error` (mid-stream upstream error), `/fail` (upstream error before the stream),
 * `/refusal`, `/long` (`max_tokens`), `/slow` (keeps the stream open, for Stop).
 */
export function devFakeScript(request: LlmRequest): FakeScript {
  const last = request.messages.at(-1)?.content.trim() ?? '';
  // Like the real rule: the language of the latest message, else the site language.
  const siteUk = request.system.at(-1)?.text.includes('(uk)') ?? false;
  const ukrainian = /[Ѐ-ӿ]/.test(last) || (!/[a-z]/i.test(last) && siteUk);
  const deltas = words(ukrainian ? DEV_ANSWERS.uk : DEV_ANSWERS.en);
  const upstream = new LlmError('Upstream overloaded_error (fake)', {
    retryable: true,
    errorType: 'overloaded_error',
  });
  const base: FakeScript = { deltas, delayMs: 60 };
  if (last.startsWith('/error')) return { ...base, failAfterDeltas: { count: 5, error: upstream } };
  if (last.startsWith('/fail')) return { ...base, failBeforeStart: upstream };
  if (last.startsWith('/refusal')) return { deltas: [], stopReason: 'refusal' };
  if (last.startsWith('/long')) return { ...base, stopReason: 'max_tokens' };
  if (last.startsWith('/slow')) return { ...base, delayMs: 1_000, hang: true };
  return base;
}
