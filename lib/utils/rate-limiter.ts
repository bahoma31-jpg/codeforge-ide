/**
 * Rate limiter utility using Sliding Window algorithm.
 * Tracks request timestamps and allows/rejects based on window config.
 */
export interface RateLimiterConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export class RateLimiter {
  private timestamps: number[] = [];
  private readonly config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
  }

  /**
   * Check if a request is allowed and record it if so.
   * @returns true if the request is allowed, false if rate limited
   */
  tryRequest(): boolean {
    const now = Date.now();
    this.cleanup(now);

    if (this.timestamps.length >= this.config.maxRequests) {
      return false;
    }

    this.timestamps.push(now);
    return true;
  }

  /**
   * Get the number of remaining requests in the current window.
   */
  remaining(): number {
    this.cleanup(Date.now());
    return Math.max(0, this.config.maxRequests - this.timestamps.length);
  }

  /**
   * Get the time until the next request will be allowed (ms).
   * Returns 0 if a request is currently allowed.
   */
  retryAfter(): number {
    this.cleanup(Date.now());
    if (this.timestamps.length < this.config.maxRequests) return 0;
    const oldest = this.timestamps[0];
    return Math.max(0, oldest + this.config.windowMs - Date.now());
  }

  /**
   * Reset the rate limiter, clearing all recorded timestamps.
   */
  reset(): void {
    this.timestamps = [];
  }

  private cleanup(now: number): void {
    const windowStart = now - this.config.windowMs;
    this.timestamps = this.timestamps.filter((t) => t > windowStart);
  }
}
