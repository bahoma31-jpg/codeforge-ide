import { get, set } from 'idb-keyval';

/** Categories of tracked events */
export type AnalyticsCategory = 'editor' | 'terminal' | 'git' | 'search' | 'settings' | 'general';

/** Single analytics event */
export interface AnalyticsEvent {
  category: AnalyticsCategory;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
}

/** Event input without auto-generated fields */
export type AnalyticsEventInput = Omit<AnalyticsEvent, 'timestamp'>;

/** Statistics summary */
export interface AnalyticsStats {
  totalEvents: number;
  byCategory: Record<string, number>;
  byAction: Record<string, number>;
  firstEvent?: number;
  lastEvent?: number;
}

const IDB_KEY = 'codeforge-analytics-events';

/**
 * Analytics service with local-first tracking.
 * All data is stored locally — no external servers.
 * Singleton pattern ensures a single instance.
 */
export class AnalyticsService {
  private static instance: AnalyticsService | null = null;
  private events: AnalyticsEvent[] = [];
  private readonly MAX_EVENTS = 1000;
  private initialized = false;

  private constructor() {}

  /** Get singleton instance */
  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /** Reset singleton (for testing) */
  static resetInstance(): void {
    AnalyticsService.instance = null;
  }

  /** Initialize by loading persisted events from IndexedDB */
  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      const stored = await get<AnalyticsEvent[]>(IDB_KEY);
      if (stored && Array.isArray(stored)) {
        this.events = stored.slice(-this.MAX_EVENTS);
      }
      this.initialized = true;
    } catch {
      // IndexedDB not available — continue with in-memory only
      this.initialized = true;
    }
  }

  /**
   * Track an analytics event.
   * @param event - Event data without timestamp
   */
  track(event: AnalyticsEventInput): void {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
    };

    this.events.push(fullEvent);

    // Enforce max events limit
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }
  }

  /**
   * Get events, optionally filtered by category.
   * @param category - Optional category filter
   */
  getEvents(category?: AnalyticsCategory): AnalyticsEvent[] {
    if (category) {
      return this.events.filter((e) => e.category === category);
    }
    return [...this.events];
  }

  /** Get aggregated statistics */
  getStats(): AnalyticsStats {
    const byCategory: Record<string, number> = {};
    const byAction: Record<string, number> = {};

    for (const event of this.events) {
      byCategory[event.category] = (byCategory[event.category] || 0) + 1;
      byAction[event.action] = (byAction[event.action] || 0) + 1;
    }

    return {
      totalEvents: this.events.length,
      byCategory,
      byAction,
      firstEvent: this.events[0]?.timestamp,
      lastEvent: this.events[this.events.length - 1]?.timestamp,
    };
  }

  /** Export all events as a JSON string */
  exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }

  /** Clear all events from memory */
  clearEvents(): void {
    this.events = [];
  }

  /** Persist events to IndexedDB */
  async flush(): Promise<void> {
    try {
      await set(IDB_KEY, this.events);
    } catch {
      // IndexedDB not available — silently fail
    }
  }
}

/** Convenience shortcut */
export const analytics = AnalyticsService.getInstance();
