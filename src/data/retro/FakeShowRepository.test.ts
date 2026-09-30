import type { ChatUsage } from '../chat/contract';
import type { ShowReplyStreamEvent } from './contract';
import { FAKE_SHOW_REPLY, FakeShowRepository } from './FakeShowRepository';
import { RETRO_FINALE_FALLBACK, RETRO_STEPS } from './scenario';
import type { ShowReplyInput } from './ShowRepository';

const usage: ChatUsage = {
  inputTokens: 1,
  outputTokens: 2,
  cacheReadInputTokens: 0,
  cacheCreationInputTokens: 0,
};
const input: ShowReplyInput = {
  step: 'fonts',
  stepsDone: 0,
  messages: [{ role: 'user', content: 'much better already' }],
};

async function collect<E>(stream: AsyncIterable<E>): Promise<E[]> {
  const events: E[] = [];
  for await (const event of stream) events.push(event);
  return events;
}

describe('FakeShowRepository', () => {
  it('narrates the manifest fallbacks by default', async () => {
    const repository = new FakeShowRepository();

    const events = await collect(repository.narrate());

    expect(events).toEqual([
      ...RETRO_STEPS.map((step) => ({ type: 'line', key: step.id, text: step.fallback })),
      { type: 'line', key: 'finale', text: RETRO_FINALE_FALLBACK },
      expect.objectContaining({ type: 'done', stopReason: 'end_turn' }),
    ]);
    expect(repository.narrateCalls).toBe(1);
  });

  it('replies with a scripted line by default and records the input', async () => {
    const repository = new FakeShowRepository();

    const events = await collect(repository.reply(input));

    expect(events).toEqual([
      { type: 'delta', text: FAKE_SHOW_REPLY },
      expect.objectContaining({ type: 'done' }),
    ]);
    expect(repository.replyInputs).toEqual([input]);
  });

  it('plays queued replies in order and stops at the first terminal event', async () => {
    const error = { code: 'unavailable' as const, message: 'off', retryable: false };
    const repository = new FakeShowRepository()
      .replyWith([
        { type: 'delta', text: 'Enjoy it ' },
        { type: 'delta', text: 'while it lasts.' },
        { type: 'done', stopReason: 'end_turn', usage },
        { type: 'delta', text: 'never shown' },
      ])
      .replyWith([{ type: 'error', error }]);

    expect(await collect(repository.reply(input))).toEqual([
      { type: 'delta', text: 'Enjoy it ' },
      { type: 'delta', text: 'while it lasts.' },
      { type: 'done', stopReason: 'end_turn', usage },
    ]);
    expect(await collect(repository.reply(input))).toEqual([{ type: 'error', error }]);
    expect(await collect(repository.reply(input))).toHaveLength(2);
  });

  it('plays a custom narration, including a failure', async () => {
    const error = { code: 'rate_limited' as const, message: 'slow down', retryable: true };
    const repository = new FakeShowRepository().narrateWith([{ type: 'error', error }]);

    expect(await collect(repository.narrate())).toEqual([{ type: 'error', error }]);
    expect(await collect(repository.narrate())).toEqual([{ type: 'error', error }]);
  });

  it('ends a held-open stream without a terminal event when the signal aborts', async () => {
    let release = (): void => undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    async function* heldOpen(): AsyncGenerator<ShowReplyStreamEvent> {
      yield { type: 'delta', text: 'Thinking' };
      await gate;
      yield { type: 'done', stopReason: 'end_turn', usage };
    }
    const repository = new FakeShowRepository().replyWith(heldOpen());
    const controller = new AbortController();
    const stream = repository.reply(input, controller.signal)[Symbol.asyncIterator]();

    expect(await stream.next()).toEqual({
      done: false,
      value: { type: 'delta', text: 'Thinking' },
    });
    const waiting = stream.next();
    controller.abort();
    expect(await waiting).toEqual({ done: true, value: undefined });
    release();
  });
});
