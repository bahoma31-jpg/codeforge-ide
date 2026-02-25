import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorLogger } from '../error-logger';

describe('ErrorLogger', () => {
  let logger: ErrorLogger;

  beforeEach(() => {
    ErrorLogger.resetInstance();
    logger = ErrorLogger.getInstance();
  });

  it('should return a singleton instance', () => {
    const a = ErrorLogger.getInstance();
    const b = ErrorLogger.getInstance();
    expect(a).toBe(b);
  });

  it('should log an info message', () => {
    logger.info('Test info');
    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('info');
    expect(logs[0].message).toBe('Test info');
  });

  it('should log a warning', () => {
    logger.warn('Test warning');
    const logs = logger.getLogs('warn');
    expect(logs).toHaveLength(1);
  });

  it('should log an error with Error object', () => {
    const err = new Error('Something failed');
    logger.error('Failure', err);
    const logs = logger.getLogs('error');
    expect(logs).toHaveLength(1);
    expect(logs[0].context?.stack).toBeDefined();
    expect(logs[0].context?.errorName).toBe('Error');
  });

  it('should log a debug message', () => {
    logger.debug('Debug info', { component: 'Editor' });
    const logs = logger.getLogs('debug');
    expect(logs).toHaveLength(1);
    expect(logs[0].context?.component).toBe('Editor');
  });

  it('should log a fatal error', () => {
    logger.fatal('Critical failure');
    const logs = logger.getLogs('fatal');
    expect(logs).toHaveLength(1);
  });

  it('should filter logs by level', () => {
    logger.info('Info 1');
    logger.warn('Warn 1');
    logger.error('Error 1');
    logger.info('Info 2');

    expect(logger.getLogs('info')).toHaveLength(2);
    expect(logger.getLogs('warn')).toHaveLength(1);
    expect(logger.getLogs('error')).toHaveLength(1);
    expect(logger.getLogs()).toHaveLength(4);
  });

  it('should include timestamp in log entries', () => {
    const before = Date.now();
    logger.info('Time test');
    const logs = logger.getLogs();
    expect(logs[0].timestamp).toBeGreaterThanOrEqual(before);
  });

  it('should include userAgent in log entries', () => {
    logger.info('UA test');
    const logs = logger.getLogs();
    expect(typeof logs[0].userAgent).toBe('string');
  });

  it('should export logs as JSON', () => {
    logger.info('Export test');
    const json = logger.exportLogs();
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].message).toBe('Export test');
  });

  it('should clear all logs', () => {
    logger.info('A');
    logger.warn('B');
    logger.clearLogs();
    expect(logger.getLogs()).toHaveLength(0);
  });

  it('should enforce MAX_LOGS limit (500)', () => {
    for (let i = 0; i < 520; i++) {
      logger.info(`Log ${i}`);
    }
    expect(logger.getLogs().length).toBeLessThanOrEqual(500);
  });

  it('should include context data', () => {
    logger.info('Context test', { action: 'save', fileId: '123' });
    const logs = logger.getLogs();
    expect(logs[0].context?.action).toBe('save');
    expect(logs[0].context?.fileId).toBe('123');
  });
});
