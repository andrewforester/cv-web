/** The runner's time source; tests and Playwright replace or fake it. */
export interface ShowClock {
  now(): number;
  setTimeout(callback: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

/** The page's clock, read at call time so fake timers (Vitest, `page.clock`) take over. */
export const systemClock: ShowClock = {
  now: () => Date.now(),
  setTimeout: (callback, ms) => setTimeout(callback, ms),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};
