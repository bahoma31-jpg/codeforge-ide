import type { Metric } from 'web-vitals';
import { AnalyticsService } from './analytics-service';

/** Web Vitals metric names */
export type VitalName = 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';

/** Rating thresholds per metric */
export type VitalRating = 'good' | 'needs-improvement' | 'poor';

/** Single vital measurement */
export interface VitalMeasurement {
  name: VitalName;
  value: number;
  rating: VitalRating;
  timestamp: number;
}

/** Complete vitals report */
export interface WebVitalsReport {
  measurements: VitalMeasurement[];
  collectedAt: number;
  summary: Record<string, { value: number; rating: VitalRating }>;
}

/** In-memory storage for collected vitals */
const vitalsStore: Map<VitalName, VitalMeasurement> = new Map();

/**
 * Handle a single web vital metric.
 * Sends the result to AnalyticsService and stores it locally.
 */
function handleMetric(metric: Metric): void {
  const measurement: VitalMeasurement = {
    name: metric.name as VitalName,
    value: metric.value,
    rating: metric.rating as VitalRating,
    timestamp: Date.now(),
  };

  vitalsStore.set(measurement.name, measurement);

  // Track in analytics
  const analytics = AnalyticsService.getInstance();
  analytics.track({
    category: 'general',
    action: `web_vital_${metric.name.toLowerCase()}`,
    label: metric.rating,
    value: Math.round(metric.value),
  });
}

/**
 * Initialize Web Vitals reporting.
 * Must be called on the client side only.
 */
export async function initWebVitals(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const { onCLS, onFID, onLCP, onTTFB, onINP } = await import('web-vitals');

    onCLS(handleMetric);
    onFID(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
    onINP(handleMetric);
  } catch {
    // web-vitals not available — skip silently
  }
}

/**
 * Get the current Web Vitals report.
 * Returns all collected measurements with a summary.
 */
export function getVitalsReport(): WebVitalsReport {
  const measurements = Array.from(vitalsStore.values());
  const summary: Record<string, { value: number; rating: VitalRating }> = {};

  for (const m of measurements) {
    summary[m.name] = { value: m.value, rating: m.rating };
  }

  return {
    measurements,
    collectedAt: Date.now(),
    summary,
  };
}

/** Reset stored vitals (for testing) */
export function resetVitals(): void {
  vitalsStore.clear();
}
