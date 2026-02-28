/**
 * CodeForge IDE — Content Security Policy (مشتركة)
 *
 * مصدر واحد لتعريفات CSP المستخدمة في:
 * - middleware.ts (runtime — dynamic headers)
 * - next.config.mjs (build-time — static fallback headers)
 *
 * ملاحظة: unsafe-eval مطلوب لـ Monaco Editor (language workers)
 * blob: مطلوب لـ Monaco Web Workers
 */

// ─── CSP Directives ───────────────────────────────────────────

export const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "worker-src 'self' blob:",
  "frame-src 'none'",
] as const;

/**
 * بناء سلسلة CSP كاملة من المصفوفة
 */
export function buildCspString(): string {
  return CSP_DIRECTIVES.join('; ');
}

// ─── Security Headers ─────────────────────────────────────────

/**
 * Headers أمنية مشتركة (بدون CSP — تُضاف منفصلة)
 */
export const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection': '1; mode=block',
} as const;
