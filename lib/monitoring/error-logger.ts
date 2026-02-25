import { v4 as uuidv4 } from 'uuid';

/** Log severity levels */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/** Single error log entry */
export interface ErrorLog {
  id: string;
  level: LogLevel;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: number;
  userAgent: string;
}

/** Log input without auto-generated fields */
export type ErrorLogInput = Omit<ErrorLog, 'id' | 'timestamp' | 'userAgent'>;

const MAX_LOGS = 500;

/**
 * Centralized error logger.
 * Collects errors and warnings with contextual information.
 * Singleton pattern.
 */
export class ErrorLogger {
  private static instance: ErrorLogger | null = null;
  private logs: ErrorLog[] = [];

  private constructor() {}

  /** Get singleton instance */
  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /** Reset singleton (for testing) */
  static resetInstance(): void {
    ErrorLogger.instance = null;
  }

  /** Get user agent string safely */
  private getUserAgent(): string {
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent;
    }
    return 'server';
  }

  /**
   * Log a message at a specific level.
   * @param level - Severity level
   * @param message - Log message
   * @param context - Optional contextual data
   */
  log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const entry: ErrorLog = {
      id: uuidv4(),
      level,
      message,
      context,
      timestamp: Date.now(),
      userAgent: this.getUserAgent(),
    };

    this.logs.push(entry);

    // Enforce max limit
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(-MAX_LOGS);
    }
  }

  /**
   * Log an error with optional Error object.
   * @param message - Error description
   * @param error - Optional Error instance for stack trace
   * @param context - Optional contextual data
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, {
      ...context,
      ...(error && { stack: error.stack, errorName: error.name }),
    });
  }

  /** Log a warning */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  /** Log an info message */
  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  /** Log a debug message */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  /** Log a fatal error */
  fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('fatal', message, {
      ...context,
      ...(error && { stack: error.stack, errorName: error.name }),
    });
  }

  /**
   * Get logs, optionally filtered by level.
   * @param level - Optional level filter
   */
  getLogs(level?: LogLevel): ErrorLog[] {
    if (level) {
      return this.logs.filter((l) => l.level === level);
    }
    return [...this.logs];
  }

  /** Export all logs as JSON string */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /** Clear all logs */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Attach global error handlers.
   * Catches unhandled errors and promise rejections.
   */
  static attachGlobalHandlers(): void {
    if (typeof window === 'undefined') return;

    const logger = ErrorLogger.getInstance();

    window.onerror = (message, source, lineno, colno, error) => {
      logger.error(String(message), error ?? undefined, {
        source: source ?? 'unknown',
        lineno: lineno ?? 0,
        colno: colno ?? 0,
      });
    };

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      logger.fatal(
        reason instanceof Error ? reason.message : String(reason),
        reason instanceof Error ? reason : undefined,
        { type: 'unhandledrejection' }
      );
    });
  }
}

/** Convenience shortcut */
export const logger = ErrorLogger.getInstance();
