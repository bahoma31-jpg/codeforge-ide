/**
 * Rate limiter utility using Sliding Window algorithm.
 * Tracks request timestamps and allows/rejects based on window config.
 */
export class RateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a request is currently allowed without recording it.
   * @returns true if the request is allowed, false if rate limited
   */
  canProceed(): boolean {
    this.cleanup(Date.now());
    return this.timestamps.length < this.maxRequests;
  }

  /**
   * Record a new request timestamp.
   * Should be called after canProceed() returns true.
   */
  record(): void {
    this.timestamps.push(Date.now());
  }

  /**
   * Execute a function if rate limit allows, otherwise throw an error.
   * @param fn - The function to execute
   * @returns The result of the function
   * @throws Error if rate limit exceeded
   */
  execute<T>(fn: () => T): T {
    if (!this.canProceed()) {
      throw new Error('Rate limit exceeded');
    }
    this.record();
    return fn();
  }

  /**
   * Get the number of remaining requests in the current window.
   */
  remaining(): number {
    this.cleanup(Date.now());
    return Math.max(0, this.maxRequests - this.timestamps.length);
  }

  /**
   * Get the time until the next request will be allowed (ms).
   * Returns 0 if a request is currently allowed.
   */
  retryAfter(): number {
    this.cleanup(Date.now());
    if (this.timestamps.length < this.maxRequests) return 0;
    const oldest = this.timestamps[0];
    return Math.max(0, oldest + this.windowMs - Date.now());
  }

  /**
   * Reset the rate limiter, clearing all recorded timestamps.
   */
  reset(): void {
    this.timestamps = [];
  }

  private cleanup(now: number): void {
    const windowStart = now - this.windowMs;
    this.timestamps = this.timestamps.filter((t) => t > windowStart);
  }
}
