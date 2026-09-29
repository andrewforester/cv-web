import { describe, expect, it } from 'vitest';
import { DEFAULT_RATE_LIMITS, RateLimiter } from './rateLimiter.js';

function limiterAt(start = 0, limits = DEFAULT_RATE_LIMITS) {
  const clock = { now: start };
  return { clock, limiter: new RateLimiter(limits, () => clock.now) };
}

function hits(limiter: RateLimiter, ip: string, count: number) {
  return Array.from({ length: count }, () => limiter.check(ip));
}

describe('RateLimiter', () => {
  it('allows 8 requests per minute per IP, then answers with the seconds left', () => {
    const { clock, limiter } = limiterAt();
    expect(hits(limiter, 'a', 8).every((decision) => decision.ok)).toBe(true);
    clock.now = 20_000;
    expect(limiter.check('a')).toEqual({ ok: false, scope: 'ip', retryAfterSeconds: 40 });
    expect(limiter.check('b').ok).toBe(true);
    clock.now = 60_000;
    expect(limiter.check('a').ok).toBe(true);
  });

  it('allows 100 requests per day per IP', () => {
    const { clock, limiter } = limiterAt();
    for (let minute = 0; minute < 13; minute++) {
      clock.now = minute * 60_000;
      hits(limiter, 'a', 8);
    }
    // 104 requests so far: the day window is exhausted even in a fresh minute.
    clock.now = 13 * 60_000;
    const decision = limiter.check('a');
    expect(decision).toMatchObject({ ok: false, scope: 'ip' });
    expect(decision.ok || decision.retryAfterSeconds).toBe(86_400 - 13 * 60);
    clock.now = 86_400_000;
    expect(limiter.check('a').ok).toBe(true);
  });

  it('caps the whole instance per hour', () => {
    const { limiter } = limiterAt(0, { ...DEFAULT_RATE_LIMITS, perInstanceHour: 3 });
    expect(hits(limiter, 'a', 1)[0]?.ok).toBe(true);
    expect(hits(limiter, 'b', 1)[0]?.ok).toBe(true);
    expect(hits(limiter, 'c', 1)[0]?.ok).toBe(true);
    expect(limiter.check('d')).toEqual({ ok: false, scope: 'instance', retryAfterSeconds: 3600 });
  });

  it('counts rejected requests too', () => {
    const { clock, limiter } = limiterAt();
    hits(limiter, 'a', 20);
    clock.now = 60_000;
    // A new minute, but the day counter kept all 20 attempts.
    expect(hits(limiter, 'a', 8).every((decision) => decision.ok)).toBe(true);
    expect(limiter.check('a').ok).toBe(false);
  });

  it('evicts the oldest IP past the key cap', () => {
    const { limiter } = limiterAt(0, { ...DEFAULT_RATE_LIMITS, maxKeys: 2 });
    hits(limiter, 'a', 8);
    limiter.check('b');
    limiter.check('c');
    expect(limiter.size).toBe(2);
    // `a` was evicted, so it starts over.
    expect(limiter.check('a').ok).toBe(true);
  });
});
