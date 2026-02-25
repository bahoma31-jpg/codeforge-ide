/**
 * Retry Logic Utilities
 * Implements exponential backoff and retry strategies for transient failures
 */

import { showWarningToast } from './toast';

export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Initial delay in milliseconds before first retry
   * @default 1000
   */
  baseDelay?: number;

  /**
   * Maximum delay in milliseconds between retries
   * @default 10000
   */
  maxDelay?: number;

  /**
   * Multiplier for exponential backoff
   * @default 2
   */
  backoffMultiplier?: number;

  /**
   * Function to determine if error is retryable
   */
  shouldRetry?: (error: Error, attempt: number) => boolean;

  /**
   * Callback called before each retry
   */
  onRetry?: (error: Error, attempt: number) => void;

  /**
   * Show toast notifications for retries
   * @default false
   */
  showToast?: boolean;
}

/**
 * Default retry options
 */
const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry'>> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  showToast: false,
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;
  let currentDelay = opts.baseDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      const shouldRetry = opts.shouldRetry
        ? opts.shouldRetry(lastError, attempt)
        : isRetryableError(lastError);

      // Don't retry if we've exhausted attempts or error is not retryable
      if (attempt >= opts.maxRetries || !shouldRetry) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        currentDelay * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelay
      );

      // Add jitter (random +/- 10%)
      const jitter = delay * (0.9 + Math.random() * 0.2);

      // Notify about retry
      if (opts.onRetry) {
        opts.onRetry(lastError, attempt + 1);
      }

      if (opts.showToast) {
        showWarningToast(
          `Retrying... (Attempt ${attempt + 1}/${opts.maxRetries})`,
          2000
        );
      }

      console.log(
        `Retry attempt ${attempt + 1}/${opts.maxRetries} after ${Math.round(jitter)}ms`,
        lastError.message
      );

      // Wait before retrying
      await delay(jitter);
    }
  }

  throw lastError!;
}

/**
 * Retry a function with linear delay (constant delay between retries)
 */
export async function retryWithLinearDelay<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt >= maxRetries || !isRetryableError(lastError)) {
        throw lastError;
      }

      await delay(delayMs);
    }
  }

  throw lastError!;
}

/**
 * Retry with custom strategy
 */
export async function retryWithStrategy<T>(
  fn: () => Promise<T>,
  strategy: (attempt: number) => number,
  maxRetries = 3
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt >= maxRetries || !isRetryableError(lastError)) {
        throw lastError;
      }

      const delayMs = strategy(attempt);
      await delay(delayMs);
    }
  }

  throw lastError!;
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: Error): boolean {
  // Network errors are retryable
  if (
    error.message.includes('fetch failed') ||
    error.message.includes('network') ||
    error.message.includes('connection')
  ) {
    return true;
  }

  // Timeout errors are retryable
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return true;
  }

  // API errors - retry on 5xx and 429 (rate limit)
  if ('statusCode' in error) {
    const statusCode = (error as any).statusCode;
    return statusCode >= 500 || statusCode === 429 || statusCode === 408;
  }

  return false;
}

/**
 * Sleep for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry with timeout - fail if operation takes too long
 */
export async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  options: RetryOptions = {}
): Promise<T> {
  return Promise.race([
    retryWithBackoff(fn, options),
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Circuit breaker pattern - stop retrying after too many failures
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold = 5,
    private timeout = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure < this.timeout) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      console.warn('Circuit breaker opened due to too many failures');
    }
  }

  getState() {
    return this.state;
  }

  reset() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
}

/**
 * Batch retry - retry multiple operations together
 */
export async function retryBatch<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<T[]> {
  const results: T[] = [];

  for (const operation of operations) {
    const result = await retryWithBackoff(operation, options);
    results.push(result);
  }

  return results;
}

/**
 * Parallel retry - retry multiple operations in parallel
 */
export async function retryParallel<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<T[]> {
  const promises = operations.map((op) => retryWithBackoff(op, options));
  return Promise.all(promises);
}
