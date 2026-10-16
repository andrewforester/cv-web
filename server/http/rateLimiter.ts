/** Fixed-window limits; each endpoint sets its own (chat: `CHAT_RATE_LIMITS`, voice: `VOICE_RATE_LIMITS`). */
export interface RateLimits {
  perIpMinute: number;
  perIpDay: number;
  perInstanceHour: number;
  /** Tracked IPs; the oldest is evicted past this. */
  maxKeys: number;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/** `ip`: this visitor is over a limit (`429`); `instance`: this instance is (`503`). */
export type RateDecision =
  { ok: true } | { ok: false; scope: 'ip' | 'instance'; retryAfterSeconds: number };

interface Window {
  start: number;
  count: number;
}

interface IpWindows {
  minute: Window;
  day: Window;
}

/** Counts `window` forward: a new window starts once `lengthMs` has passed. */
function hit(window: Window, now: number, lengthMs: number): void {
  if (now - window.start >= lengthMs) {
    window.start = now;
    window.count = 0;
  }
  window.count += 1;
}

function secondsLeft(window: Window, now: number, lengthMs: number): number {
  return Math.max(1, Math.ceil((window.start + lengthMs - now) / 1000));
}

/**
 * In-memory, per-instance limiter. Best effort: instances don't share counts (the Vercel
 * Firewall rule counts across them). Every call counts, allowed or not.
 */
export class RateLimiter {
  private readonly byIp = new Map<string, IpWindows>();
  private readonly instance: Window = { start: 0, count: 0 };

  constructor(
    private readonly limits: RateLimits,
    private readonly now: () => number = Date.now,
  ) {}

  check(ip: string): RateDecision {
    const now = this.now();
    const windows = this.windowsFor(ip, now);
    hit(windows.minute, now, MINUTE_MS);
    hit(windows.day, now, DAY_MS);
    hit(this.instance, now, HOUR_MS);

    if (windows.day.count > this.limits.perIpDay) {
      return { ok: false, scope: 'ip', retryAfterSeconds: secondsLeft(windows.day, now, DAY_MS) };
    }
    if (windows.minute.count > this.limits.perIpMinute) {
      return {
        ok: false,
        scope: 'ip',
        retryAfterSeconds: secondsLeft(windows.minute, now, MINUTE_MS),
      };
    }
    if (this.instance.count > this.limits.perInstanceHour) {
      return {
        ok: false,
        scope: 'instance',
        retryAfterSeconds: secondsLeft(this.instance, now, HOUR_MS),
      };
    }
    return { ok: true };
  }

  /** Number of tracked IPs (for tests). */
  get size(): number {
    return this.byIp.size;
  }

  private windowsFor(ip: string, now: number): IpWindows {
    const existing = this.byIp.get(ip);
    if (existing) return existing;
    if (this.byIp.size >= this.limits.maxKeys) {
      const oldest = this.byIp.keys().next().value;
      if (oldest !== undefined) this.byIp.delete(oldest);
    }
    const created = { minute: { start: now, count: 0 }, day: { start: now, count: 0 } };
    this.byIp.set(ip, created);
    return created;
  }
}
