import type { ChatUsage } from '../chat/contract';
import type { ShowNarrateStreamEvent, ShowReplyStreamEvent } from './contract';
import { SHOW_SCENARIOS, type ShowScenarioId } from './scenarios';
import type { ShowReplyInput, ShowRepository } from './ShowRepository';

/** A scripted stream: plain events, or an async iterable a test can hold open. */
export type ShowScript<E> = Iterable<E> | AsyncIterable<E>;

export const FAKE_SHOW_REPLY = 'Noted. This is a scripted reply from the fake show repository.';

const NO_USAGE: ChatUsage = {
  inputTokens: 0,
  outputTokens: 0,
  cacheReadInputTokens: 0,
  cacheCreationInputTokens: 0,
};

/**
 * Scripted `ShowRepository` for tests and dev. `narrate` plays the script set with
 * `narrateWith()` (default: that scenario's fallback lines, then `done`); each `reply` plays the
 * next script queued with `replyWith()` (default: `FAKE_SHOW_REPLY`, then `done`). A stream stops
 * after its first terminal event, or when `signal` aborts, even while a script is held open.
 */
export class FakeShowRepository implements ShowRepository {
  /** The scenario of every `narrate` call, in order. */
  readonly narrateScenarios: ShowScenarioId[] = [];
  readonly replyInputs: ShowReplyInput[] = [];
  private narration: ShowScript<ShowNarrateStreamEvent> | null = null;
  private readonly replies: ShowScript<ShowReplyStreamEvent>[] = [];

  narrateWith(script: ShowScript<ShowNarrateStreamEvent>): this {
    this.narration = script;
    return this;
  }

  replyWith(script: ShowScript<ShowReplyStreamEvent>): this {
    this.replies.push(script);
    return this;
  }

  narrate(scenario: ShowScenarioId, signal?: AbortSignal): AsyncIterable<ShowNarrateStreamEvent> {
    this.narrateScenarios.push(scenario);
    return play(this.narration ?? fallbackNarration(scenario), signal);
  }

  reply(input: ShowReplyInput, signal?: AbortSignal): AsyncIterable<ShowReplyStreamEvent> {
    this.replyInputs.push(input);
    return play(this.replies.shift() ?? scriptedReply(), signal);
  }
}

function fallbackNarration(scenario: ShowScenarioId): ShowNarrateStreamEvent[] {
  const { steps, finale } = SHOW_SCENARIOS[scenario];
  return [
    ...steps.map(({ id, fallback }) => ({ type: 'line' as const, key: id, text: fallback })),
    { type: 'line', key: 'finale', text: finale },
    { type: 'done', stopReason: 'end_turn', usage: NO_USAGE },
  ];
}

function scriptedReply(): ShowReplyStreamEvent[] {
  return [
    { type: 'delta', text: FAKE_SHOW_REPLY },
    { type: 'done', stopReason: 'end_turn', usage: NO_USAGE },
  ];
}

async function* play<E extends { type: string }>(
  script: ShowScript<E>,
  signal?: AbortSignal,
): AsyncGenerator<E> {
  const events = (async function* () {
    yield* script;
  })();
  const aborted = new Promise<undefined>((resolve) => {
    signal?.addEventListener('abort', () => resolve(undefined), { once: true });
  });
  for (;;) {
    if (signal?.aborted) return;
    const next = await Promise.race([events.next(), aborted]);
    if (!next || next.done || signal?.aborted) return;
    yield next.value;
    if (next.value.type === 'done' || next.value.type === 'error') return;
  }
}
