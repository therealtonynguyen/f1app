/**
 * OpenF1 API configuration.
 *
 * FREE TIER  — max 3 requests / second (default below).
 * PAID TIER  — raise requestsPerSecond to match your plan limit (e.g. 10 or 20).
 *              Set VITE_OPENF1_RPS=10 in your .env.local to override without touching code.
 */
export const API_CONFIG = {
  /**
   * How many requests we're allowed to fire per second.
   * Reads from VITE_OPENF1_RPS env var so you can flip tiers without a code change.
   */
  requestsPerSecond: Number(import.meta.env.VITE_OPENF1_RPS ?? 3),

  /**
   * How many times to silently retry a failed request before surfacing the error.
   * Applies to rate-limit (429) and transient network failures.
   */
  maxRetries: 4,

  /**
   * Base delay (ms) before the first retry. Doubles on each subsequent attempt
   * (exponential backoff). E.g. 800 → 1600 → 3200 → 6400 ms.
   */
  retryBaseDelayMs: 800,
} as const;
