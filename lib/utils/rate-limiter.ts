/**
 * Rate limiter utility using Sliding Window algorithm.
 * Tracks request timestamps and allows/blocks based on configured limits.
 */
export class RateLimiter {
  private maxRequests: number;
  private windowMs: number;
  private requests: number[];

  /**
   * Create a new RateLimiter instance.
   * @param maxRequests - Maximum number of requests allowed within the window
   * @param windowMs - Time window in milliseconds
   */
  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  /**
   * Clean up expired timestamps outside the sliding window.
   */
  private cleanup(): void {
    const now = Date.now();
    this.requests = this.requests.filter(
      (timestamp) => now - timestamp < this.windowMs
    );
  }

  /**
   * Check if an action is allowed without recording it.
   * @returns true if the action can proceed
   */
  canProceed(): boolean {
    this.cleanup();
    return this.requests.length < this.maxRequests;
  }

  /**
   * Record an action timestamp.
   */
  record(): void {
    this.requests.push(Date.now());
  }

  /**
   * Execute a function if rate limit allows, otherwise throw an error.
   * @param fn - Function to execute
   * @returns The return value of the executed function
   * @throws Error if rate limit is exceeded
   */
  execute<T>(fn: () => T): T {
    if (!this.canProceed()) {
      throw new Error('Rate limit exceeded');
    }
    this.record();
    return fn();
  }

  /**
   * Reset the rate limiter by clearing all recorded requests.
   */
  reset(): void {
    this.requests = [];
  }
}
