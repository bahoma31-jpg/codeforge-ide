/** Application health status */
export type HealthState = 'healthy' | 'degraded' | 'unhealthy';

/** Complete health status snapshot */
export interface HealthStatus {
  status: HealthState;
  uptime: number;
  memoryUsage?: number;
  activeEditors: number;
  activeTerminals: number;
  totalFiles: number;
  lastError?: string;
  timestamp: number;
}

/** Status change callback */
export type StatusChangeCallback = (status: HealthStatus) => void;

/**
 * Application health monitor.
 * Periodically checks application health metrics.
 * Singleton pattern.
 */
export class HealthMonitor {
  private static instance: HealthMonitor | null = null;
  private startTime: number;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<StatusChangeCallback> = new Set();
  private lastStatus: HealthStatus | null = null;
  private errorCount = 0;
  private lastError?: string;

  private constructor() {
    this.startTime = Date.now();
  }

  /** Get singleton instance */
  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  /** Reset singleton (for testing) */
  static resetInstance(): void {
    if (HealthMonitor.instance) {
      HealthMonitor.instance.stopMonitoring();
    }
    HealthMonitor.instance = null;
  }

  /** Get memory usage in MB (if available) */
  private getMemoryUsage(): number | undefined {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as { memory: { usedJSHeapSize: number } })
        .memory;
      return Math.round(memory.usedJSHeapSize / (1024 * 1024));
    }
    return undefined;
  }

  /** Determine health state based on metrics */
  private determineState(): HealthState {
    const memory = this.getMemoryUsage();

    // Unhealthy if too many errors or very high memory
    if (this.errorCount > 10) return 'unhealthy';
    if (memory && memory > 512) return 'unhealthy';

    // Degraded if moderate errors or high memory
    if (this.errorCount > 3) return 'degraded';
    if (memory && memory > 256) return 'degraded';

    return 'healthy';
  }

  /**
   * Get current health status snapshot.
   * Reads active editors/terminals/files from DOM counts as a simple heuristic.
   */
  getStatus(): HealthStatus {
    const uptimeMs = Date.now() - this.startTime;

    const status: HealthStatus = {
      status: this.determineState(),
      uptime: Math.floor(uptimeMs / 1000),
      memoryUsage: this.getMemoryUsage(),
      activeEditors: this.countElements('[data-editor-tab]'),
      activeTerminals: this.countElements('[data-terminal-instance]'),
      totalFiles: this.countElements('[data-file-item]'),
      lastError: this.lastError,
      timestamp: Date.now(),
    };

    this.lastStatus = status;
    return status;
  }

  /** Count DOM elements matching a selector (safe for SSR) */
  private countElements(selector: string): number {
    if (typeof document === 'undefined') return 0;
    try {
      return document.querySelectorAll(selector).length;
    } catch {
      return 0;
    }
  }

  /**
   * Start periodic health monitoring.
   * @param intervalMs - Check interval in milliseconds (default: 30000)
   */
  startMonitoring(intervalMs = 30000): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      const status = this.getStatus();
      this.notifyListeners(status);
    }, intervalMs);
  }

  /** Stop periodic health monitoring */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Register a callback for status changes.
   * @param callback - Function called on each status update
   * @returns Unsubscribe function
   */
  onStatusChange(callback: StatusChangeCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /** Notify all registered listeners */
  private notifyListeners(status: HealthStatus): void {
    for (const listener of this.listeners) {
      try {
        listener(status);
      } catch {
        // Don't let listener errors break monitoring
      }
    }
  }

  /** Record an error occurrence */
  recordError(message: string): void {
    this.errorCount++;
    this.lastError = message;
  }

  /** Reset error counts */
  resetErrors(): void {
    this.errorCount = 0;
    this.lastError = undefined;
  }

  /** Check if monitoring is active */
  isMonitoring(): boolean {
    return this.intervalId !== null;
  }
}

/** Convenience shortcut */
export const healthMonitor = HealthMonitor.getInstance();
