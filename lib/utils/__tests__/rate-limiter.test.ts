import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimiter } from '../rate-limiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests within the limit', () => {
    const limiter = new RateLimiter(3, 1000);

    expect(limiter.canProceed()).toBe(true);
    limiter.record();
    expect(limiter.canProceed()).toBe(true);
    limiter.record();
    expect(limiter.canProceed()).toBe(true);
    limiter.record();
  });

  it('should block requests that exceed the limit', () => {
    const limiter = new RateLimiter(2, 1000);

    limiter.record();
    limiter.record();

    expect(limiter.canProceed()).toBe(false);
  });

  it('should allow requests after the window expires', () => {
    const limiter = new RateLimiter(2, 1000);

    limiter.record();
    limiter.record();
    expect(limiter.canProceed()).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(1001);
    expect(limiter.canProceed()).toBe(true);
  });

  it('should execute function when within limit', () => {
    const limiter = new RateLimiter(5, 1000);
    const result = limiter.execute(() => 'success');
    expect(result).toBe('success');
  });

  it('should throw error when execute is called and rate limit exceeded', () => {
    const limiter = new RateLimiter(1, 1000);
    limiter.record();

    expect(() => limiter.execute(() => 'fail')).toThrow(
      'Rate limit exceeded'
    );
  });

  it('should reset the state', () => {
    const limiter = new RateLimiter(1, 1000);
    limiter.record();
    expect(limiter.canProceed()).toBe(false);

    limiter.reset();
    expect(limiter.canProceed()).toBe(true);
  });

  it('should handle sliding window correctly', () => {
    const limiter = new RateLimiter(2, 1000);

    limiter.record();
    vi.advanceTimersByTime(500);
    limiter.record();

    expect(limiter.canProceed()).toBe(false);

    // First request should expire
    vi.advanceTimersByTime(501);
    expect(limiter.canProceed()).toBe(true);
  });
});
