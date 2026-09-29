const DAY_MS = 86_400_000;

/**
 * This instance's estimated model spend for the current UTC day (docs/chat/AGENT.md §6). In
 * memory only: it restarts on a cold start and every instance counts alone, so the daily budget
 * is a soft brake; the hard cap is the Anthropic workspace spend limit.
 */
export class DayCostMeter {
  private day = -1;
  private totalUsd = 0;

  constructor(private readonly now: () => number = Date.now) {}

  private roll(): void {
    const day = Math.floor(this.now() / DAY_MS);
    if (day !== this.day) {
      this.day = day;
      this.totalUsd = 0;
    }
  }

  add(costUsd: number): void {
    this.roll();
    this.totalUsd += costUsd;
  }

  /** Today's total so far, rounded like `costUsd`. */
  totalToday(): number {
    this.roll();
    return Math.round(this.totalUsd * 1_000_000) / 1_000_000;
  }

  /** Whole seconds until the next UTC midnight (at least 1). */
  secondsToNextDay(): number {
    const now = this.now();
    return Math.max(1, Math.ceil((Math.floor(now / DAY_MS + 1) * DAY_MS - now) / 1000));
  }
}
