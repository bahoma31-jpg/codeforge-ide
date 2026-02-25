# Phase 9: Security Hardening & Performance Optimization

## Overview

Phase 9 introduces a comprehensive security and performance layer to CodeForge IDE. This includes HTTP security headers via Next.js middleware, input sanitization utilities to prevent common web attacks, a rate limiter for abuse prevention, performance-optimized React hooks, and a robust error boundary component.

---

## Security Middleware

**File:** `middleware.ts` (project root)

The middleware intercepts all incoming requests (except static assets and API routes) and applies the following security headers:

| Header                      | Value                                                            | Purpose                                                                                                            |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `Content-Security-Policy`   | `default-src 'self'; script-src 'self' 'unsafe-eval' blob:; ...` | Controls which resources the browser can load. Allows `unsafe-eval` for Monaco Editor and `blob:` for Web Workers. |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload`                   | Forces HTTPS for 1 year on all subdomains.                                                                         |
| `X-Content-Type-Options`    | `nosniff`                                                        | Prevents browser MIME-type sniffing.                                                                               |
| `X-Frame-Options`           | `DENY`                                                           | Blocks the app from being loaded in iframes (clickjacking protection).                                             |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                                | Limits referrer information sent to external sites.                                                                |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()`                       | Disables access to camera, microphone, and geolocation APIs.                                                       |
| `X-XSS-Protection`          | `1; mode=block`                                                  | Enables legacy browser XSS filter.                                                                                 |

### Matcher Configuration

The middleware excludes these paths:

- `/api/*` — API routes
- `/_next/static/*` — Static assets
- `/_next/image/*` — Optimized images
- `/favicon.ico` — Favicon

---

## Input Sanitization

**File:** `lib/utils/sanitize.ts`

Four utility functions to sanitize user inputs and prevent injection attacks.

### `sanitizeHTML(input: string): string`

Escapes HTML entities to prevent Cross-Site Scripting (XSS).

```typescript
import { sanitizeHTML } from '@/lib/utils/sanitize';

sanitizeHTML('<script>alert("xss")</script>');
// Output: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'

sanitizeHTML('Hello <b>World</b>');
// Output: 'Hello &lt;b&gt;World&lt;/b&gt;'
```

### `sanitizePath(path: string): string`

Protects against Path Traversal by removing `..` segments and normalizing slashes.

```typescript
import { sanitizePath } from '@/lib/utils/sanitize';

sanitizePath('../../etc/passwd');
// Output: 'etc/passwd'

sanitizePath('path//to///file.txt');
// Output: 'path/to/file.txt'
```

### `sanitizeCommand(command: string): string`

Removes ASCII control characters (0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F, 0x7F) while preserving tabs, newlines, and carriage returns.

```typescript
import { sanitizeCommand } from '@/lib/utils/sanitize';

sanitizeCommand('ls -la\x00\x1F /home');
// Output: 'ls -la /home'
```

### `sanitizeFileName(name: string): string`

Removes invalid filename characters and enforces a 255-character limit.

```typescript
import { sanitizeFileName } from '@/lib/utils/sanitize';

sanitizeFileName('my/file:name*.txt');
// Output: 'myfilename.txt'

sanitizeFileName('');
// Output: 'untitled'
```

---

## Rate Limiter

**File:** `lib/utils/rate-limiter.ts`

A sliding window rate limiter class for controlling the frequency of actions.

### Usage

```typescript
import { RateLimiter } from '@/lib/utils/rate-limiter';

// Allow 10 requests per 60 seconds
const limiter = new RateLimiter(10, 60000);

// Check if action is allowed
if (limiter.canProceed()) {
  limiter.record();
  // perform action
}

// Or use execute() for automatic checking + recording
try {
  const result = limiter.execute(() => {
    return fetchData();
  });
} catch (error) {
  console.error('Rate limit exceeded, please wait.');
}

// Reset all recorded requests
limiter.reset();
```

### API

| Method                       | Description                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------- |
| `canProceed(): boolean`      | Returns `true` if the action is within the rate limit. Does not record.         |
| `record(): void`             | Records the current timestamp as an action.                                     |
| `execute<T>(fn: () => T): T` | Executes `fn` if within limit, throws `Error('Rate limit exceeded')` otherwise. |
| `reset(): void`              | Clears all recorded request timestamps.                                         |

---

## Performance Hooks

**File:** `lib/hooks/use-performance.ts`

Three React 18-compatible hooks for performance optimization.

### `useDebounce(callback, delay)`

Debounces a callback function. Ideal for search inputs and resize handlers.

```typescript
import { useDebounce } from '@/lib/hooks/use-performance';

function SearchBar() {
  const debouncedSearch = useDebounce((query: string) => {
    performSearch(query);
  }, 300);

  return <input onChange={(e) => debouncedSearch(e.target.value)} />;
}
```

### `useThrottle(callback, limit)`

Throttles a callback function. Ideal for scroll and mouse move events.

```typescript
import { useThrottle } from '@/lib/hooks/use-performance';

function ScrollHandler() {
  const throttledScroll = useThrottle(() => {
    updateScrollPosition();
  }, 100);

  useEffect(() => {
    window.addEventListener('scroll', throttledScroll);
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [throttledScroll]);
}
```

### `useMemoizedFileTree(data, deps)`

Memoizes expensive file tree computations based on dependency changes.

```typescript
import { useMemoizedFileTree } from '@/lib/hooks/use-performance';

function FileExplorer({ files }: { files: FileNode[] }) {
  const tree = useMemoizedFileTree(
    buildFileTree(files),
    [files]
  );

  return <TreeView data={tree} />;
}
```

---

## Error Boundary

**File:** `components/codeforge/layout/error-boundary.tsx`

A React class component that catches JavaScript errors in its child component tree and displays a fallback UI.

### Basic Usage

```tsx
import { ErrorBoundary } from '@/components/codeforge/layout/error-boundary';

function App() {
  return (
    <ErrorBoundary>
      <EditorPanel />
    </ErrorBoundary>
  );
}
```

### With Custom Fallback

```tsx
<ErrorBoundary fallback={<div>Custom error message</div>}>
  <RiskyComponent />
</ErrorBoundary>
```

### Features

- Dark theme UI (`bg-[#1e1e1e]`) matching CodeForge's design
- Displays error message and collapsible stack trace
- **Try Again** button to reset error state and re-render children
- Optional `fallback` prop for custom error UI

---

## Next.js Config Updates

**File:** `next.config.ts`

Added an `async headers()` function as a **fallback security layer** in addition to the middleware. This ensures security headers are present even if the middleware is bypassed.

### Added Headers

| Header                   | Value                             |
| ------------------------ | --------------------------------- |
| `X-DNS-Prefetch-Control` | `on`                              |
| `X-Content-Type-Options` | `nosniff`                         |
| `X-Frame-Options`        | `DENY`                            |
| `Referrer-Policy`        | `strict-origin-when-cross-origin` |

> **Note:** The existing `webpack` configuration for Monaco Editor and `transpilePackages` were preserved without modification.

---

## Running Tests

All tests use [Vitest](https://vitest.dev/) (^1.3.0).

### Run All Tests

```bash
pnpm test
```

### Run Sanitization Tests Only

```bash
pnpm vitest run lib/utils/__tests__/sanitize.test.ts
```

### Run Rate Limiter Tests Only

```bash
pnpm vitest run lib/utils/__tests__/rate-limiter.test.ts
```

### Run Phase 9 Tests Only

```bash
pnpm vitest run lib/utils/__tests__/sanitize.test.ts lib/utils/__tests__/rate-limiter.test.ts
```

### Watch Mode

```bash
pnpm vitest watch lib/utils/__tests__/
```

---

## Files Created/Modified

| File                                             | Action   | Description                                     |
| ------------------------------------------------ | -------- | ----------------------------------------------- |
| `middleware.ts`                                  | Created  | Security middleware with 7 HTTP headers         |
| `lib/utils/sanitize.ts`                          | Created  | Input sanitization utilities (4 functions)      |
| `next.config.ts`                                 | Modified | Added fallback security headers                 |
| `lib/hooks/use-performance.ts`                   | Created  | Performance hooks (debounce, throttle, memoize) |
| `components/codeforge/layout/error-boundary.tsx` | Created  | Error boundary component                        |
| `lib/utils/rate-limiter.ts`                      | Created  | Sliding window rate limiter                     |
| `lib/utils/__tests__/sanitize.test.ts`           | Created  | Unit tests for sanitization                     |
| `lib/utils/__tests__/rate-limiter.test.ts`       | Created  | Unit tests for rate limiter                     |
| `docs/PHASE9_SECURITY_PERFORMANCE.md`            | Created  | This documentation                              |
