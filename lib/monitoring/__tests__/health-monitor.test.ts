import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { HealthMonitor } from '../health-monitor';

describe('HealthMonitor', () => {
  let monitor: HealthMonitor;

  beforeEach(() => {
    HealthMonitor.resetInstance();
    monitor = HealthMonitor.getInstance();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return a singleton instance', () => {
    const a = HealthMonitor.getInstance();
    const b = HealthMonitor.getInstance();
    expect(a).toBe(b);
  });

  it('should return a health status', () => {
    const status = monitor.getStatus();
    expect(status).toHaveProperty('status');
    expect(status).toHaveProperty('uptime');
    expect(status).toHaveProperty('timestamp');
    expect(['healthy', 'degraded', 'unhealthy']).toContain(status.status);
  });

  it('should start with healthy status', () => {
    const status = monitor.getStatus();
    expect(status.status).toBe('healthy');
  });

  it('should track uptime correctly', () => {
    vi.advanceTimersByTime(5000);
    const status = monitor.getStatus();
    expect(status.uptime).toBeGreaterThanOrEqual(5);
  });

  it('should start and stop monitoring', () => {
    expect(monitor.isMonitoring()).toBe(false);
    monitor.startMonitoring(1000);
    expect(monitor.isMonitoring()).toBe(true);
    monitor.stopMonitoring();
    expect(monitor.isMonitoring()).toBe(false);
  });

  it('should not start monitoring twice', () => {
    monitor.startMonitoring(1000);
    monitor.startMonitoring(1000);
    expect(monitor.isMonitoring()).toBe(true);
    monitor.stopMonitoring();
  });

  it('should notify listeners on status change', () => {
    const callback = vi.fn();
    monitor.onStatusChange(callback);
    monitor.startMonitoring(1000);

    vi.advanceTimersByTime(1001);
    expect(callback).toHaveBeenCalled();

    monitor.stopMonitoring();
  });

  it('should unsubscribe listener correctly', () => {
    const callback = vi.fn();
    const unsubscribe = monitor.onStatusChange(callback);
    unsubscribe();

    monitor.startMonitoring(1000);
    vi.advanceTimersByTime(1001);

    expect(callback).not.toHaveBeenCalled();
    monitor.stopMonitoring();
  });

  it('should record errors and update status', () => {
    monitor.recordError('Test error');
    const status = monitor.getStatus();
    expect(status.lastError).toBe('Test error');
  });

  it('should degrade status with multiple errors', () => {
    for (let i = 0; i < 5; i++) {
      monitor.recordError(`Error ${i}`);
    }
    const status = monitor.getStatus();
    expect(status.status).toBe('degraded');
  });

  it('should become unhealthy with many errors', () => {
    for (let i = 0; i < 15; i++) {
      monitor.recordError(`Error ${i}`);
    }
    const status = monitor.getStatus();
    expect(status.status).toBe('unhealthy');
  });

  it('should reset errors', () => {
    for (let i = 0; i < 15; i++) {
      monitor.recordError(`Error ${i}`);
    }
    monitor.resetErrors();
    const status = monitor.getStatus();
    expect(status.status).toBe('healthy');
    expect(status.lastError).toBeUndefined();
  });
});
