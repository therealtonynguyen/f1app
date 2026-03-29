/**
 * Token-bucket rate limiter.
 *
 * Allows up to `requestsPerSecond` calls immediately (the "burst"), then queues
 * anything over that and drains the queue as tokens refill — so we never fire
 * more than N requests per second regardless of how many are in flight.
 */
export class RateLimiter {
  private tokens: number;
  private readonly maxTokens: number;
  private readonly intervalMs: number;
  private lastRefillMs: number;
  private readonly queue: Array<() => void> = [];
  private drainTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(requestsPerSecond: number) {
    // Guard against misconfiguration
    const rps = Math.max(1, requestsPerSecond);
    this.maxTokens = rps;
    this.tokens = rps;
    this.intervalMs = 1000 / rps;
    this.lastRefillMs = Date.now();
  }

  /**
   * Call this before every fetch. Returns a promise that resolves when a token
   * is available — i.e. it's safe to fire the next request.
   */
  acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
      this.scheduleDrain();
    });
  }

  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefillMs;
    const newTokens = (elapsed / 1000) * this.maxTokens;
    if (newTokens >= 1) {
      this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
      this.lastRefillMs = now;
    }
  }

  private scheduleDrain() {
    if (this.drainTimer !== null) return;
    this.drainTimer = setTimeout(() => {
      this.drainTimer = null;
      this.refill();

      while (this.tokens >= 1 && this.queue.length > 0) {
        this.tokens -= 1;
        this.queue.shift()!();
      }

      if (this.queue.length > 0) {
        this.scheduleDrain();
      }
    }, this.intervalMs);
  }
}
