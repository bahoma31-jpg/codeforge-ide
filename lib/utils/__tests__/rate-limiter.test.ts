import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimiter } from '../rate-limiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests within limit', () => {
    const limiter = new RateLimiter({ maxRequests: 5, windowMs: 1000 });
    expect(limiter.canProceed()).toBe(true);
  });

  it('should block requests exceeding limit', () => {
    const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 });
    limiter.record();
    limiter.record();
    expect(limiter.canProceed()).toBe(false);
  });

  it('should allow requests after window expires', () => {
    const limiter = new RateLimiter({ maxRequests: 1, windowMs: 1000 });
    limiter.record();
    expect(limiter.canProceed()).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(1001);
    expect(limiter.canProceed()).toBe(true);
  });

  it('should throw on rate limit exceeded in execute', async () => {
    const limiter = new RateLimiter({ maxRequests: 1, windowMs: 1000 });
    limiter.record();
    await expect(
      limiter.execute(() => Promise.resolve('test'))
    ).rejects.toThrow('Rate limit exceeded');
  });

  it('should execute function when within limit', async () => {
    const limiter = new RateLimiter({ maxRequests: 5, windowMs: 1000 });
    const result = await limiter.execute(() => Promise.resolve('success'));
    expect(result).toBe('success');
  });

  it('should report correct remaining requests', () => {
    const limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });
    expect(limiter.remaining()).toBe(3);

    limiter.record();
    expect(limiter.remaining()).toBe(2);

    limiter.record();
    limiter.record();
    expect(limiter.remaining()).toBe(0);
  });

  it('should reset all recorded requests', () => {
    const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 });
    limiter.record();
    limiter.record();
    expect(limiter.canProceed()).toBe(false);

    limiter.reset();
    expect(limiter.canProceed()).toBe(true);
    expect(limiter.remaining()).toBe(2);
  });

  it('should use sliding window correctly', () => {
    const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 });

    limiter.record();
    vi.advanceTimersByTime(500);
    limiter.record();
    expect(limiter.canProceed()).toBe(false);

    // First request should expire
    vi.advanceTimersByTime(501);
    expect(limiter.canProceed()).toBe(true);
  });
});
