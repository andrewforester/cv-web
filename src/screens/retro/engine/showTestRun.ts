import { planShow } from './consolePlan';
import type { ShowSource, TokenReader } from './consolePlan';
import { nextWakeMs } from './schedule';
import { showReducer } from './showReducer';
import { createShowState } from './showState';
import type { ShowConfig, ShowCopy, ShowEvent, ShowState } from './showTypes';

/** An event without its clock reading: the run stamps it. */
type WithoutNow<E> = E extends unknown ? Omit<E, 'now'> : never;
type EventInput = WithoutNow<ShowEvent>;

export const TEST_COPY: ShowCopy = {
  introLine: 'Intro line.',
  fixLine: 'Fix line.',
  closingLine: 'Closing line.',
  scriptedReply: 'Scripted reply.',
  tooLong: '*** too long',
  offline: '*** offline',
};

/**
 * Drives the reducer like the state holder does, on a fake clock: `advance(ms)` wakes it at every
 * `nextWakeMs` in between, so tests see exactly what the runner would do.
 */
export class ShowTestRun {
  now = 1_000_000;
  state: ShowState;

  constructor(
    source: ShowSource,
    options: Partial<Omit<ShowConfig, 'plan'>> = {},
    readToken: TokenReader = () => undefined,
  ) {
    const config: ShowConfig = {
      plan: planShow(source, readToken),
      copy: TEST_COPY,
      reducedMotion: false,
      llm: false,
      ...options,
    };
    this.state = createShowState(config, this.now);
  }

  advance(ms: number): this {
    const end = this.now + ms;
    for (let guard = 0; guard < 100_000; guard++) {
      const wake = nextWakeMs(this.state);
      if (wake === null || this.now + Math.max(wake, 1) > end) break;
      this.now += Math.max(wake, 1);
      this.state = showReducer(this.state, { type: 'tick', now: this.now });
    }
    this.now = end;
    this.state = showReducer(this.state, { type: 'tick', now: end });
    return this;
  }

  /** Advances until `predicate` holds (or `limitMs` passes); returns the ms it took. */
  advanceUntil(predicate: (state: ShowState) => boolean, limitMs = 120_000): number {
    const start = this.now;
    while (!predicate(this.state) && this.now - start < limitMs) this.advance(10);
    return this.now - start;
  }

  dispatch(event: EventInput): this {
    this.state = showReducer(this.state, { ...event, now: this.now } as ShowEvent);
    return this;
  }

  status(key: string) {
    return this.state.effects[key]?.status;
  }
}
