# Phase 9: Security Hardening & Performance Optimization

## Overview

Phase 9 focuses on hardening the CodeForge IDE application against common web security vulnerabilities and optimizing runtime performance. This phase introduces input sanitization utilities, rate limiting, security headers via Next.js middleware, performance monitoring tools, and a global error boundary.

## Completion Date

February 25, 2026

## Features Implemented

### 1. Input Sanitization (`lib/utils/sanitize.ts`)

A comprehensive set of sanitization functions to prevent XSS, path traversal, and injection attacks.

| Function | Purpose |
|----------|--------|
| `sanitizeHTML(input)` | Escapes HTML entities (`<`, `>`, `&`, `"`, `'`, `/`) to prevent XSS |
| `sanitizePath(input)` | Removes `..` traversal sequences, normalizes slashes, strips leading `/` |
| `sanitizeCommand(input)` | Strips null bytes and control characters (0x00-0x1F, 0x7F) |
| `sanitizeFileName(input)` | Removes invalid filename chars (`<>:"|?*\\`), leading dots, truncates to 255 chars |

**Usage Example:**

```typescript
import { sanitizeHTML, sanitizePath } from '@/lib/utils/sanitize';

// Prevent XSS in user-provided content
const safeContent = sanitizeHTML(userInput);

// Prevent path traversal in file operations
const safePath = sanitizePath(requestedPath);
```

### 2. Rate Limiter (`lib/utils/rate-limiter.ts`)

A sliding-window rate limiter for controlling the frequency of operations like API calls, file saves, and terminal commands.

**Configuration:**

```typescript
import { RateLimiter } from '@/lib/utils/rate-limiter';

const limiter = new RateLimiter({
  maxRequests: 10,   // Maximum requests allowed
  windowMs: 60000,   // Time window in milliseconds (1 minute)
});
```

**API:**

| Method | Returns | Description |
|--------|---------|------------|
| `canProceed()` | `boolean` | Check if a new request is allowed |
| `record()` | `void` | Record a new request timestamp |
| `remaining()` | `number` | Get remaining requests in current window |
| `reset()` | `void` | Clear all recorded requests |
| `execute(fn)` | `Promise<T>` | Execute function if within limit, throws otherwise |

### 3. Security Headers Middleware (`middleware.ts`)

Next.js middleware that injects critical security headers into every HTTP response.

**Headers Applied:**

| Header | Value | Purpose |
|--------|-------|--------|
| `Content-Security-Policy` | Restrictive CSP | Prevents XSS and data injection |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Enforces HTTPS |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME type sniffing |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS protection |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer information |
| `Permissions-Policy` | Restrictive policy | Limits browser feature access |

**CSP Directives:**
- `default-src 'self'` — Only allow same-origin resources by default
- `script-src 'self' 'unsafe-eval'` — Required for Monaco Editor
- `style-src 'self' 'unsafe-inline'` — Required for dynamic theming
- `font-src 'self' data:` — Monaco Editor font loading
- `worker-src 'self' blob:` — Monaco Editor web workers

### 4. Performance Utilities (`lib/utils/performance.ts`)

Runtime performance monitoring and optimization tools.

| Utility | Type | Description |
|---------|------|------------|
| `debounce(fn, delay)` | Function | Delays execution until `delay` ms of inactivity |
| `throttle(fn, limit)` | Function | Limits execution to once per `limit` ms |
| `measurePerformance(name, fn)` | Async Function | Measures and logs execution time of async operations |
| `PerformanceMonitor` | Class | Tracks multiple performance marks and calculates averages |

**PerformanceMonitor API:**

```typescript
import { PerformanceMonitor } from '@/lib/utils/performance';

const monitor = new PerformanceMonitor();
monitor.mark('editor-load-start');
// ... editor loading logic ...
monitor.mark('editor-load-end');
const duration = monitor.measure('editor-load', 'editor-load-start', 'editor-load-end');

// Get statistics
const stats = monitor.getStats('editor-load');
// { avg: 245.5, min: 200, max: 291, count: 10 }
```

### 5. Error Boundary (`components/codeforge/layout/error-boundary.tsx`)

A React class component that catches JavaScript runtime errors in the component tree and displays a user-friendly fallback UI instead of crashing the entire application.

**Features:**
- Catches all errors in child component tree
- Displays error message with VS Code-styled dark UI
- "Try Again" button to reset error state and re-render
- Supports custom fallback UI via `fallback` prop
- Logs errors to console with component stack trace

**Usage:**

```tsx
import { ErrorBoundary } from '@/components/codeforge/layout/error-boundary';

// Wrap critical sections
<ErrorBoundary>
  <EditorPanel />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={<div>Editor failed to load</div>}>
  <MonacoEditor />
</ErrorBoundary>
```

### 6. Next.js Config Security Fallback (`next.config.ts`)

Added fallback security headers in `next.config.ts` as a secondary layer in case middleware is bypassed.

**Fallback Headers:**
- `X-DNS-Prefetch-Control: on`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Test Coverage

### Unit Tests

| Test File | Covers | Tests |
|-----------|--------|-------|
| `lib/utils/__tests__/sanitize.test.ts` | `sanitizeHTML`, `sanitizePath`, `sanitizeCommand`, `sanitizeFileName` | 24 tests |
| `lib/utils/__tests__/rate-limiter.test.ts` | `RateLimiter` class | 8 tests |

**Total: 32 new unit tests**

### Running Tests

```bash
# Run all Phase 9 tests
npx vitest run lib/utils/__tests__/sanitize.test.ts lib/utils/__tests__/rate-limiter.test.ts

# Run with coverage
npx vitest run --coverage lib/utils/__tests__/
```

## Files Created

| File | Size | Description |
|------|------|------------|
| `lib/utils/sanitize.ts` | ~2.5 KB | Input sanitization functions |
| `lib/utils/rate-limiter.ts` | ~2.5 KB | Sliding window rate limiter |
| `middleware.ts` | ~3.0 KB | Security headers middleware |
| `lib/utils/performance.ts` | ~3.5 KB | Performance monitoring utilities |
| `components/codeforge/layout/error-boundary.tsx` | ~3.5 KB | Global error boundary component |
| `lib/utils/__tests__/sanitize.test.ts` | ~3.5 KB | Sanitization unit tests |
| `lib/utils/__tests__/rate-limiter.test.ts` | ~2.5 KB | Rate limiter unit tests |
| `docs/phase9-security-performance.md` | ~7.0 KB | This documentation file |

## Files Modified

| File | Changes |
|------|--------|
| `next.config.ts` | Added `headers()` function with fallback security headers |

## Architecture Decisions

1. **Middleware over API routes** — Security headers are applied globally via Next.js middleware rather than per-route, ensuring no endpoint is left unprotected.

2. **Dual-layer headers** — Both middleware and `next.config.ts` set security headers as defense-in-depth. Middleware provides the full set; config provides fallback basics.

3. **Sliding window rate limiting** — Chosen over fixed-window to provide smoother throttling behavior and prevent burst attacks at window boundaries.

4. **Class-based Error Boundary** — React's error boundary API requires class components, so this is intentionally not a functional component.

5. **CSP with unsafe-eval** — Required for Monaco Editor's dynamic code evaluation. This is documented and scoped to `script-src` only.

## Security Considerations

- **CSP allows `unsafe-eval`** for Monaco Editor — this is a known trade-off. Consider using a nonce-based approach in production.
- **Rate limiter is client-side only** — For production deployments, server-side rate limiting (e.g., via Redis) is recommended.
- **Sanitization is defense-in-depth** — Always sanitize on both client and server sides.

## Next Steps (Phase 10)

- Set up CI/CD pipeline with GitHub Actions
- Automated testing workflow on push/PR
- Build verification and deployment pipeline
- Code quality checks (lint, format, type-check)
