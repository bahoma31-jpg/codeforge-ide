# Phase 11: Monitoring, Analytics & PWA Support

## Overview

Phase 11 is the **final phase** of CodeForge IDE, transforming the application into a production-ready product with three pillars: **notifications & monitoring**, **usage analytics**, and **PWA support**. All tracking is local-first — no data is sent to external servers.

---

## Notification System

### Store — `lib/stores/notification-store.ts`

Zustand-based store managing application notifications.

```typescript
import { useNotificationStore } from '@/lib/stores/notification-store';

// Add a notification
const id = useNotificationStore.getState().addNotification({
  type: 'success', // 'info' | 'success' | 'warning' | 'error'
  title: 'File saved',
  message: 'index.ts saved successfully',
  autoDismiss: true,
  dismissAfterMs: 3000,
});

// Add with action button
useNotificationStore.getState().addNotification({
  type: 'error',
  title: 'Build failed',
  message: 'TypeScript compilation error',
  autoDismiss: false,
  action: {
    label: 'View Errors',
    onClick: () => openErrorPanel(),
  },
});

// Mark all as read
useNotificationStore.getState().markAllAsRead();

// Clear all
useNotificationStore.getState().clearAll();
```

### UI Components

| Component | File | Description |
|-----------|------|-------------|
| `NotificationToast` | `components/codeforge/notifications/notification-toast.tsx` | Bottom-right toast stack, shows up to 5 unread, auto-dismiss |
| `NotificationCenter` | `components/codeforge/notifications/notification-center.tsx` | Side panel with filter tabs, mark all read, clear all |
| `NotificationBadge` | `components/codeforge/notifications/notification-badge.tsx` | Bell icon with unread count for Status Bar |

### Usage in Layout

```tsx
import { NotificationToast } from '@/components/codeforge/notifications/notification-toast';
import { NotificationBadge } from '@/components/codeforge/notifications/notification-badge';
import { NotificationCenter } from '@/components/codeforge/notifications/notification-center';

function App() {
  const [showCenter, setShowCenter] = useState(false);

  return (
    <>
      <StatusBar>
        <NotificationBadge onClick={() => setShowCenter(true)} />
      </StatusBar>
      <NotificationToast />
      <NotificationCenter isOpen={showCenter} onClose={() => setShowCenter(false)} />
    </>
  );
}
```

---

## Analytics Service

### Core Service — `lib/analytics/analytics-service.ts`

Singleton analytics service with local-first storage via `idb-keyval`.

```typescript
import { analytics } from '@/lib/analytics/analytics-service';

// Initialize (load persisted events)
await analytics.init();

// Track events
analytics.track({ category: 'editor', action: 'file_opened', label: 'index.ts' });
analytics.track({ category: 'terminal', action: 'command_run', label: 'npm test', value: 1500 });
analytics.track({ category: 'git', action: 'commit_created' });

// Get statistics
const stats = analytics.getStats();
// { totalEvents: 3, byCategory: { editor: 1, terminal: 1, git: 1 }, ... }

// Export as JSON
const json = analytics.exportEvents();

// Persist to IndexedDB
await analytics.flush();
```

**Categories:** `editor`, `terminal`, `git`, `search`, `settings`, `general`

**Limits:** Max 1000 events in memory. Oldest events are discarded.

### Web Vitals — `lib/analytics/web-vitals-reporter.ts`

Collects Core Web Vitals (LCP, FID, CLS, TTFB, INP) and feeds them to AnalyticsService.

```typescript
import { initWebVitals, getVitalsReport } from '@/lib/analytics/web-vitals-reporter';

// Initialize on app mount (client-side only)
initWebVitals();

// Get report
const report = getVitalsReport();
// { measurements: [...], summary: { LCP: { value: 1200, rating: 'good' }, ... } }
```

---

## Monitoring System

### Error Logger — `lib/monitoring/error-logger.ts`

Centralized error logging with severity levels and global error handlers.

```typescript
import { logger } from '@/lib/monitoring/error-logger';
import { ErrorLogger } from '@/lib/monitoring/error-logger';

// Log at different levels
logger.debug('Component rendered', { component: 'Editor' });
logger.info('File opened', { fileId: '123' });
logger.warn('Large file detected', { size: 5000000 });
logger.error('Save failed', new Error('Network timeout'), { fileId: '123' });
logger.fatal('Application crash', new Error('Out of memory'));

// Get filtered logs
const errors = logger.getLogs('error');
const allLogs = logger.getLogs();

// Export for debugging
const json = logger.exportLogs();

// Attach global handlers (call once on app init)
ErrorLogger.attachGlobalHandlers();
```

**Levels:** `debug` < `info` < `warn` < `error` < `fatal`

**Limits:** Max 500 log entries.

### Health Monitor — `lib/monitoring/health-monitor.ts`

Periodic application health checks with status reporting.

```typescript
import { healthMonitor } from '@/lib/monitoring/health-monitor';

// Get current status
const status = healthMonitor.getStatus();
// { status: 'healthy', uptime: 3600, memoryUsage: 128, ... }

// Start periodic monitoring (every 30 seconds)
healthMonitor.startMonitoring();

// Listen for status changes
const unsubscribe = healthMonitor.onStatusChange((status) => {
  if (status.status === 'degraded') {
    logger.warn('App health degraded', status);
  }
});

// Cleanup
unsubscribe();
healthMonitor.stopMonitoring();
```

**Health States:**
- `healthy` — Normal operation
- `degraded` — High memory (>256MB) or moderate errors (>3)
- `unhealthy` — Very high memory (>512MB) or many errors (>10)

---

## PWA Support

### Configuration

| File | Purpose |
|------|---------|
| `public/manifest.json` | PWA manifest with app metadata |
| `public/icons/icon.svg` | Source SVG icon |
| `public/icons/README.md` | Icon generation instructions |
| `next.config.ts` | next-pwa integration with caching |
| `app/layout.tsx` | PWA meta tags |

### Caching Strategies

| Resource Type | Strategy | Cache Duration |
|--------------|----------|---------------|
| Images, fonts, icons | Cache First | 30 days |
| JavaScript, CSS | Stale While Revalidate | 7 days |
| HTML pages | Network First | 1 day |

### Installing as PWA

1. Visit the deployed CodeForge IDE in Chrome/Edge
2. Click the install icon in the address bar (or menu → "Install CodeForge IDE")
3. The app opens in its own window with standalone display

### Generating PWA Icons

```bash
# From public/icons/
convert icon.svg -resize 192x192 icon-192x192.png
convert icon.svg -resize 512x512 icon-512x512.png
```

---

## Stores Added

Phase 11 also includes stores that were planned in earlier phases:

| Store | File | Purpose |
|-------|------|---------|
| Search Store | `lib/stores/search-store.ts` | Search & replace state management |
| Extensions Store | `lib/stores/extensions-store.ts` | Extension lifecycle management |
| Settings Store | `lib/stores/settings-store.ts` | Application settings (editor, theme, terminal) |

---

## Running Tests

```bash
# Run all Phase 11 tests
pnpm vitest run lib/stores/__tests__/notification-store.test.ts \
  lib/analytics/__tests__/analytics-service.test.ts \
  lib/monitoring/__tests__/error-logger.test.ts \
  lib/monitoring/__tests__/health-monitor.test.ts \
  lib/stores/__tests__/search-store.test.ts \
  lib/stores/__tests__/extensions-store.test.ts \
  lib/stores/__tests__/settings-store.test.ts

# Run all tests
pnpm test

# Watch mode
pnpm vitest watch

# Coverage
pnpm test:coverage
```

---

## Troubleshooting

### PWA not installing
- Ensure you're on HTTPS (or localhost for dev)
- Check that `manifest.json` is accessible at `/manifest.json`
- Verify icon files exist in `public/icons/`
- PWA is disabled in development mode by default

### Analytics not persisting
- Call `analytics.flush()` before page unload
- Check browser IndexedDB storage (DevTools → Application → IndexedDB)
- Verify `idb-keyval` is installed: `pnpm list idb-keyval`

### Health monitor shows 'unhealthy'
- Check `healthMonitor.getStatus().memoryUsage` for memory leaks
- Review `logger.getLogs('error')` for accumulated errors
- Call `healthMonitor.resetErrors()` after resolving issues
