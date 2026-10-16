/** How long a typed line may come back from the platform as a visitor transcript. */
export const TYPED_ECHO_WINDOW_MS = 10_000;

/**
 * The typed lines of a call sent in the last 10 s (docs/voice/SYSTEM_DESIGN.md §4.4): if the
 * platform echoes one as a visitor transcript, the chat already shows it, so the adapter drops it.
 * Only an exact (trimmed) match of the oldest one counts, once.
 */
export class TypedEcho {
  private sentLines: { text: string; at: number }[] = [];

  /** Remembers a typed line sent at `at` (ms). */
  sent(text: string, at: number): void {
    this.forgetOld(at);
    this.sentLines.push({ text: text.trim(), at });
  }

  /** Whether a visitor transcript heard at `at` is the echo of a typed line; it is consumed. */
  isEcho(text: string, at: number): boolean {
    this.forgetOld(at);
    if (this.sentLines[0]?.text !== text.trim()) return false;
    this.sentLines.shift();
    return true;
  }

  private forgetOld(now: number): void {
    this.sentLines = this.sentLines.filter((line) => now - line.at <= TYPED_ECHO_WINDOW_MS);
  }
}
