/**
 * @module rate-limiter
 * @description Client-side rate limiting for API calls and expensive operations.
 * Uses a sliding window algorithm to control the frequency of actions.
 */

/** Configuration options for the rate limiter */
interface RateLimitConfig {
  /** Maximum number of requests allowed within the time window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/**
 * Client-side rate limiter using a sliding window algorithm.
 * Tracks request timestamps and enforces rate limits to prevent
 * abuse of expensive operations.
 *
 * @example
 * ```typescript
 * const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 });
 *
 * if (limiter.canProceed()) {
 *   limiter.record();
 *   await performExpensiveOperation();
 * }
 *
 * // Or use the execute method:
 * const result = await limiter.execute(() => fetchData());
 * ```
 */
export class RateLimiter {
  /** Timestamps of recorded requests */
  private requests: number[] = [];
  /** Rate limit configuration */
  private readonly config: RateLimitConfig;

  /**
   * Create a new RateLimiter instance.
   * @param config - Rate limit configuration with maxRequests and windowMs
   */
  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if the next action is allowed under the current rate limit.
   * Cleans up expired timestamps before checking.
   * @returns True if the action is allowed, false if rate limited
   */
  canProceed(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(
      (time) => now - time < this.config.windowMs
    );
    return this.requests.length < this.config.maxRequests;
  }

  /**
   * Record a new action timestamp.
   * Call this after performing the rate-limited action.
   */
  record(): void {
    this.requests.push(Date.now());
  }

  /**
   * Execute a function with rate limiting.
   * Checks the rate limit, records the action, and executes the function.
   * Throws an error if the rate limit is exceeded.
   *
   * @param fn - Async function to execute
   * @returns The result of the executed function
   * @throws Error if rate limit is exceeded
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canProceed()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    this.record();
    return fn();
  }

  /**
   * Get the number of remaining allowed requests in the current window.
   * @returns Number of remaining requests
   */
  remaining(): number {
    const now = Date.now();
    this.requests = this.requests.filter(
      (time) => now - time < this.config.windowMs
    );
    return Math.max(0, this.config.maxRequests - this.requests.length);
  }

  /**
   * Reset the rate limiter, clearing all recorded requests.
   */
  reset(): void {
    this.requests = [];
  }
}
